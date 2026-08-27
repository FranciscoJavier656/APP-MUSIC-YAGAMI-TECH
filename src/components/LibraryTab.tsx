import OfflineDetailView from './OfflineDetailView';
import React, { useState, useEffect, useMemo } from 'react';
import { OfflineImage } from './OfflineImage';
import { getImageSrc } from '../lib/image';
import { Capacitor } from '@capacitor/core';
import { motion } from 'motion/react';
import { Music, Play, Disc, Trash2, Heart, ListMusic, User, Search, Filter, ChevronLeft } from 'lucide-react';
import { usePlayer } from './PlayerContext';

export default function LibraryTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [offlineAlbums, setOfflineAlbums] = useState<any[]>([]);
  const [offlineArtists, setOfflineArtists] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'playlists' | 'albums' | 'artists' | 'favorites'>('favorites');
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'local'>('local');
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { playTrack } = usePlayer();

  const loadOfflineLibrary = () => {
    try {
      // Tracks (favorites)
      const tracksStr = localStorage.getItem('offline_library_tracks');
      if (tracksStr) {
        const tracksObj = JSON.parse(tracksStr);
        const tracks = Object.values(tracksObj).sort((a: any, b: any) => {
          return (b.downloadedAt || 0) - (a.downloadedAt || 0);
        });
        setOfflineTracks(tracks);
      } else {
        // Fallback backward compatibility
        const oldStr = localStorage.getItem('offline_tracks');
        if (oldStr) {
           const oldObj = JSON.parse(oldStr);
           setOfflineTracks(Object.values(oldObj));
        } else {
           setOfflineTracks([]);
        }
      }

      // Albums
      const albumsStr = localStorage.getItem('offline_library_albums');
      if (albumsStr) {
        setOfflineAlbums(Object.values(JSON.parse(albumsStr)));
      } else {
        setOfflineAlbums([]);
      }

      // Artists
      const artistsStr = localStorage.getItem('offline_library_artists');
      if (artistsStr) {
        setOfflineArtists(Object.values(JSON.parse(artistsStr)));
      } else {
        setOfflineArtists([]);
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
    { id: 'albums', title: 'Álbumes', icon: Disc },
    { id: 'artists', title: 'Artistas', icon: User },
    { id: 'favorites', title: 'Favoritos', icon: Heart }
  ];

  // Process data for the views
  const items = useMemo(() => {
    if (activeTab === 'favorites') {
      return offlineTracks.map(track => {
        if (track.type === 'track') return track; // Ya viene formateado
        // Fallback viejo formato
        return {
          id: track.id,
          title: track.title,
          subtitle: track.artist?.name || track.performer?.name,
          image: track.album?.image?.small || track.image?.small || track.image,
          type: 'track',
          original: track
        };
      });
    }
    if (activeTab === 'albums') {
      return offlineAlbums;
    }
    if (activeTab === 'artists') {
      return offlineArtists;
    }
    return [];
  }, [offlineTracks, offlineAlbums, offlineArtists, activeTab]);

  const handleFilterToggle = () => {
    setFavoriteFilter(prev => prev === 'all' ? 'local' : 'all');
  };

  const removeTrack = (trackId: string) => {
     if(window.confirm("¿Estás seguro de eliminar este elemento?")) {
        try {
           const tracksStr = localStorage.getItem('offline_tracks');
           if(tracksStr) {
              const tracksObj = JSON.parse(tracksStr);
              delete tracksObj[trackId];
              localStorage.setItem('offline_tracks', JSON.stringify(tracksObj));
              loadOfflineLibrary();
           }
        } catch(e){}
     }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#000] pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]"></div>
      </div>
    );
  }


  
  const renderDrillDown = () => {
    const parent = selectedAlbum || selectedArtist;
    if (!parent) return null;

    const tracks = offlineTracks.filter(t => {
      const orig = t.original || t;
      if (selectedAlbum) {
         return (orig.album?.id?.toString() === selectedAlbum.id) || (orig.album?.title === selectedAlbum.title);
      }
      if (selectedArtist) {
         const aId = orig.artist?.id?.toString() || orig.artist?.name || orig.performer?.name;
         return aId === selectedArtist.id || orig.artist?.name === selectedArtist.title;
      }
      return false;
    });

    return <OfflineDetailView 
             item={parent} 
             tracks={tracks} 
             type={selectedAlbum ? 'album' : 'artist'} 
             onBack={() => { setSelectedAlbum(null); setSelectedArtist(null); }} 
           />;
  };

  const renderEmptyState = () => {
    const activeTabInfo = tabs.find(t => t.id === activeTab);
    const IconComponent = activeTabInfo?.icon || Music;
    
    return (
      <div className="flex-1 mx-4 overflow-hidden rounded-[20px] mb-24 mt-4">
        <div className="flex-1 h-full bg-[#1DB954]/5 backdrop-blur-[20px] flex flex-col items-center justify-center p-10 border border-[#1DB954]/10">
          <IconComponent className="w-20 h-20 text-[#1DB954]/30" />
          <h3 className="text-2xl font-bold text-white mt-5 mb-2 text-center">
            No hay {activeTabInfo?.title.toLowerCase()}
          </h3>
          <p className="text-white/60 text-sm text-center mb-6">
            Explora música y añade tus {activeTabInfo?.title.toLowerCase()} favoritos
          </p>
          <button className="overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-r from-[#1DB954]/40 to-[#1DB954]/20 backdrop-blur-[40px] px-6 py-3.5 flex items-center gap-2">
              <Search className="w-5 h-5 text-white" />
              <span className="text-white text-base font-semibold">Explorar música</span>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-black pb-[180px]">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-black pointer-events-none" />
      
      <div className="relative pt-[10px] flex flex-col min-h-full">
        {/* Animated Header */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2.5 mx-4 overflow-hidden rounded-[20px] backdrop-blur-[30px]"
        >
          <div className="bg-gradient-to-br from-[#1DB954]/20 to-black/80 p-5 border border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-[32px] font-bold text-white mb-1">Mi Biblioteca</h1>
                <p className="text-sm text-white/60">
                  {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
                  {activeTab === 'favorites' && (
                    <span style={{ color: favoriteFilter === 'local' ? '#ff9800' : '#1DB954' }}>
                      {' '}• {favoriteFilter === 'local' ? 'Locales' : 'Streaming'}
                    </span>
                  )}
                </p>
              </div>
              <button 
                onClick={handleFilterToggle}
                disabled={activeTab !== 'favorites'}
                className={`overflow-hidden rounded-xl ${activeTab !== 'favorites' ? 'opacity-50' : ''}`}
              >
                <div className="p-3 backdrop-blur-[40px] bg-white/5 border border-white/5">
                  <Filter 
                    size={24} 
                    color={favoriteFilter === 'local' ? '#ff9800' : '#1DB954'} 
                  />
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Bar */}
        <div className="mt-4 mb-2 mx-4 overflow-hidden rounded-[20px] backdrop-blur-md">
          <div className="flex gap-2 px-3 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSelectedAlbum(null); setSelectedArtist(null); }}
                  className={`overflow-hidden rounded-2xl flex-shrink-0 transition-all ${isActive ? 'shadow-[0_4px_12px_rgba(29,185,84,0.3)]' : ''}`}
                >
                  <div className={`flex items-center gap-2 px-4 py-2.5 backdrop-blur-[20px] border border-white/5 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#1DB954]/20 to-[#1DB954]/10' 
                      : 'bg-white/5'
                  }`}>
                    <Icon 
                      className="w-4 h-4" 
                      color={isActive ? '#1DB954' : 'rgba(255,255,255,0.6)'} 
                    />
                    <span className={`text-sm font-semibold ${isActive ? 'text-[#1DB954]' : 'text-white/60'}`}>
                      {tab.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {(selectedAlbum || selectedArtist) ? renderDrillDown() : items.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="px-4 pb-[180px] space-y-3">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="mb-3">
                  <div className="overflow-hidden rounded-2xl backdrop-blur-[15px] bg-white/5 border border-white/5">
                    <div className="flex items-center p-3 gap-3">
                      <div className="relative">
                        <OfflineImage 
                          localPath={item.localCoverPath || item.original?.localCoverPath} 
                          remoteUrl={getImageSrc(item.image) || getImageSrc(item.original?.album?.image || item.original?.image)} 
                          alt="" 
                          className={`w-20 h-20 bg-white/5 ${item.type === 'artist' ? 'rounded-full' : 'rounded-xl'} object-cover`}
                        />
                        {/* Type Badge */}
                        <div className="absolute -bottom-1 -right-1 overflow-hidden rounded-xl">
                          <div className="p-1.5 backdrop-blur-md bg-black/50 border border-white/10">
                            {item.type === 'artist' ? <User size={12} color="#fff" /> : 
                             item.type === 'album' ? <Disc size={12} color="#fff" /> : 
                             <Music size={12} color="#fff" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 gap-1 cursor-pointer" onClick={() => {
                        if (item.type === 'album') setSelectedAlbum(item);
                        if (item.type === 'artist') setSelectedArtist(item);
                      }}>
                        <h4 className="text-base font-bold text-white">{item.title}</h4>
                        <p className="text-[13px] text-white/60">{item.subtitle}</p>
                        {item.trackCount && (
                          <div className="flex items-center gap-1 mt-1">
                            <ListMusic size={12} color="rgba(255,255,255,0.5)" />
                            <span className="text-xs text-white/50">{item.trackCount} {item.trackCount === 1 ? 'pista' : 'pistas'}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row gap-2">
                        {(item.type === 'track' || activeTab === 'favorites') && (
                          <button 
                            onClick={() => {
                               playTrack({ 
                                 ...item.original, 
                                 localPath: item.original.localPath || item.localPath 
                               });
                            }}
                            className="overflow-hidden rounded-xl"
                          >
                            <div className="p-3 backdrop-blur-[20px] bg-white/10 border border-white/5 hover:bg-[#1DB954] transition-colors group">
                              <Play className="w-5 h-5 text-white/80 group-hover:text-white fill-current ml-0.5" />
                            </div>
                          </button>
                        )}
                        {item.type === 'track' && (
                          <button onClick={() => removeTrack(item.id)} className="overflow-hidden rounded-xl ml-1">
                            <div className="p-3 backdrop-blur-[20px] bg-white/10 border border-white/5 hover:bg-red-500/80 transition-colors group">
                              <Trash2 className="w-5 h-5 text-white/80 group-hover:text-white" />
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
