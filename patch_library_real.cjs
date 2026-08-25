const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Music, Play, Disc, Download, Trash2, Heart, ListMusic, Mic2, Album } from 'lucide-react';
import { usePlayer } from './PlayerContext';

export default function LibraryTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'playlists' | 'albums' | 'artists' | 'favorites'>('favorites');
  const [isLoading, setIsLoading] = useState(true);
  
  const { playTrack } = usePlayer();

  const loadOfflineLibrary = () => {
    try {
      const tracksStr = localStorage.getItem('offline_tracks');
      if (tracksStr) {
        const tracksObj = JSON.parse(tracksStr);
        const tracks = Object.values(tracksObj).sort((a: any, b: any) => {
          return (b.downloadedAt || 0) - (a.downloadedAt || 0);
        });
        setOfflineTracks(tracks);
      } else {
        setOfflineTracks([]);
      }
    } catch (e) {
      console.error("Error loading offline library:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineLibrary();
    const handleUpdate = () => loadOfflineLibrary();
    window.addEventListener('offline-library-updated', handleUpdate);
    return () => window.removeEventListener('offline-library-updated', handleUpdate);
  }, []);

  const tabs = [
    { id: 'playlists', title: 'Playlists', icon: ListMusic },
    { id: 'albums', title: 'Álbumes', icon: Album },
    { id: 'artists', title: 'Artistas', icon: Mic2 },
    { id: 'favorites', title: 'Favoritos', icon: Heart }
  ];

  // Group items based on active tab
  const displayItems = useMemo(() => {
    if (activeTab === 'favorites') {
      return offlineTracks; // Just show all offline tracks for now as favorites
    }
    if (activeTab === 'albums') {
      const albumsMap = new Map();
      offlineTracks.forEach(track => {
        if (track.album) {
          if (!albumsMap.has(track.album.id)) {
            albumsMap.set(track.album.id, {
              id: track.album.id,
              title: track.album.title,
              artist: track.artist?.name || track.performer?.name,
              image: track.album.image?.small,
              count: 1,
              type: 'album'
            });
          } else {
            albumsMap.get(track.album.id).count += 1;
          }
        }
      });
      return Array.from(albumsMap.values());
    }
    if (activeTab === 'artists') {
      const artistsMap = new Map();
      offlineTracks.forEach(track => {
        const artistName = track.artist?.name || track.performer?.name;
        const artistId = track.artist?.id || artistName;
        if (artistName) {
          if (!artistsMap.has(artistId)) {
            artistsMap.set(artistId, {
              id: artistId,
              title: artistName,
              image: track.artist?.image?.small || track.image?.small,
              count: 1,
              type: 'artist'
            });
          } else {
            artistsMap.get(artistId).count += 1;
          }
        }
      });
      return Array.from(artistsMap.values());
    }
    return [];
  }, [offlineTracks, activeTab]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]"></div>
      </div>
    );
  }

  const renderEmptyState = () => {
    const activeTabInfo = tabs.find(t => t.id === activeTab);
    const IconComponent = activeTabInfo?.icon || Music;
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-20 bg-[#1DB954]/5 rounded-2xl border border-[#1DB954]/10 mx-4">
        <IconComponent className="w-20 h-20 text-[#1DB954]/30 mb-6" />
        <h3 className="text-2xl font-bold text-white mb-2">
          No hay {activeTabInfo?.title.toLowerCase()}
        </h3>
        <p className="text-white/60 text-sm max-w-[250px] mb-8">
          Explora música y añade tus {activeTabInfo?.title.toLowerCase()} favoritos
        </p>
        <button className="flex items-center gap-2 bg-[#1DB954]/20 px-6 py-3 rounded-2xl border border-[#1DB954]/30 text-white font-bold backdrop-blur-md">
          <Music className="w-5 h-5" />
          <span>Explorar música</span>
        </button>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-black bg-gradient-to-b from-[#121212] to-black pb-24">
      <div className="p-4 pt-14">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-[32px] font-bold text-white mb-1 tracking-tight">Mi Biblioteca</h1>
            <p className="text-white/60 text-sm">
              {displayItems.length} {displayItems.length === 1 ? 'elemento' : 'elementos'}
              {activeTab === 'favorites' && (
                <span className="text-[#1DB954]"> • Locales</span>
              )}
            </p>
          </div>
          <button className="bg-white/5 p-3 rounded-xl backdrop-blur-md border border-white/5">
            <Heart className="w-6 h-6 text-[#1DB954]" fill="currentColor" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={\`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all \${
                  isActive 
                    ? 'bg-white/10 text-[#1DB954] shadow-[0_4px_12px_rgba(29,185,84,0.15)] border border-white/5' 
                    : 'bg-transparent text-white/60'
                }\`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* List Content */}
        {displayItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className="bg-white/5 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 border border-white/5 cursor-pointer group hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (activeTab === 'favorites') {
                    playTrack({ ...item, streamUrl: Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(item.localPath) : item.localPath });
                  }
                }}
              >
                <div className={\`relative w-[72px] h-[72px] bg-white/10 \${activeTab === 'artists' ? 'rounded-full' : 'rounded-xl'} overflow-hidden flex-shrink-0\`}>
                  {item.album?.image?.small || item.image?.small || item.image ? (
                    <img src={item.album?.image?.small || item.image?.small || item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Music className="w-8 h-8" />
                    </div>
                  )}
                  {activeTab === 'favorites' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  )}
                  
                  {activeTab === 'favorites' && (
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md rounded-full p-1">
                      <Heart className="w-3 h-3 text-[#1DB954]" fill="currentColor" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pl-1">
                  <h4 className="font-bold text-base text-white truncate mb-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-white/60 truncate flex items-center gap-1">
                    {activeTab === 'favorites' ? (
                      item.artist?.name || item.performer?.name
                    ) : (
                      <>
                        <Disc className="w-3 h-3" />
                        {item.count} {item.count === 1 ? 'pista' : 'pistas'}
                      </>
                    )}
                  </p>
                </div>
                
                {activeTab === 'favorites' && (
                  <div className="flex items-center gap-3 pr-2">
                    <button className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`
fs.writeFileSync('src/components/LibraryTab.tsx', code);
console.log("Patched LibraryTab to mirror v2 LibraryScreen");
