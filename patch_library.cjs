const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Music, AlertCircle, Play, Disc, Download, Trash2, CheckCircle, Database, HardDrive, Filter } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { useDownloads } from '../lib/DownloadContext';

export default function LibraryTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'downloading' | 'completed'>('all');
  
  const { playTrack } = usePlayer();
  const { activeDownloads } = useDownloads();
  const activeDownloadList = Object.values(activeDownloads);

  const loadOfflineLibrary = () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Just for preview purposes on web
        const tracksStr = localStorage.getItem('offline_tracks');
        if (tracksStr) {
          const tracksObj = JSON.parse(tracksStr);
          const tracks = Object.values(tracksObj).sort((a: any, b: any) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
          setOfflineTracks(tracks);
        } else {
          setOfflineTracks([]);
        }
        setIsLoading(false);
        return;
      }
      
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

  const stats = useMemo(() => {
    return {
      active: activeDownloadList.filter(dl => dl.status !== 'completed' && dl.status !== 'error').length,
      completed: offlineTracks.length,
      total: activeDownloadList.length + offlineTracks.length
    };
  }, [activeDownloadList, offlineTracks]);

  const clearOfflineTracks = () => {
    if (window.confirm("¿Seguro que deseas eliminar todas las pistas descargadas?")) {
      localStorage.removeItem('offline_tracks');
      setOfflineTracks([]);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]"></div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-20">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
        <Disc className="w-10 h-10 text-white/40" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Librería Vacía</h3>
      <p className="text-white/60 text-sm max-w-[250px] mb-8">
        No tienes pistas descargadas aún. Las descargas aparecerán aquí.
      </p>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-black bg-gradient-to-b from-[#121212] to-black pb-24">
      <div className="p-4 pt-14">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-[32px] font-bold text-white mb-1 tracking-tight">Librería</h1>
            <p className="text-white/60 text-sm">Música disponible offline</p>
          </div>
          {offlineTracks.length > 0 && (
            <button 
              onClick={clearOfflineTracks}
              className="flex items-center gap-2 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="text-red-500 text-xs font-bold">Limpiar</span>
            </button>
          )}
        </div>

        {stats.total > 0 ? (
          <>
            {/* Stats Cards */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                <Download className="w-6 h-6 text-[#1E90FF] mb-2" />
                <span className="text-xl font-bold text-white">{stats.active}</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1">Activas</span>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                <CheckCircle className="w-6 h-6 text-[#1DB954] mb-2" />
                <span className="text-xl font-bold text-white">{stats.completed}</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1">Pistas</span>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                <HardDrive className="w-6 h-6 text-[#FFA500] mb-2" />
                <span className="text-xl font-bold text-white">{stats.total}</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1">Total</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setFilter('all')}
                className={\`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors \${filter === 'all' ? 'bg-[#1DB954] text-white' : 'bg-white/10 text-white/60'}\`}
              >
                Todas
              </button>
              <button 
                onClick={() => setFilter('downloading')}
                className={\`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors \${filter === 'downloading' ? 'bg-[#1DB954] text-white' : 'bg-white/10 text-white/60'}\`}
              >
                Descargando
              </button>
              <button 
                onClick={() => setFilter('completed')}
                className={\`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors \${filter === 'completed' ? 'bg-[#1DB954] text-white' : 'bg-white/10 text-white/60'}\`}
              >
                Completadas
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {/* Active Downloads */}
              {(filter === 'all' || filter === 'downloading') && activeDownloadList.map((dl) => {
                const getStatusText = (status: string) => {
                  switch(status) {
                    case 'queued': return 'En cola...';
                    case 'downloading': return 'Descargando...';
                    case 'processing_metadata': return 'Metadatos...';
                    case 'importing_library': return 'Importando...';
                    case 'organizing': return 'Organizando...';
                    case 'completed': return '¡Completado!';
                    case 'error': return 'Error';
                    default: return 'Procesando...';
                  }
                };

                const isProcessing = ['processing_metadata', 'importing_library', 'organizing'].includes(dl.status);

                return (
                  <div key={dl.trackId} className="bg-white/5 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 border border-white/5">
                    <div className="w-[60px] h-[60px] bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                      {dl.trackMetadata?.album?.image?.small || dl.trackMetadata?.image?.small ? (
                        <img src={dl.trackMetadata.album?.image?.small || dl.trackMetadata.image?.small} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <Download className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-white text-base truncate mb-0.5">{dl.trackMetadata?.title || 'Unknown Track'}</h4>
                      <p className="text-xs text-white/60 truncate mb-2">{dl.trackMetadata?.artist?.name || 'Unknown Artist'}</p>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={\`h-full transition-all duration-300 \${dl.status === 'completed' ? 'bg-[#1DB954]' : dl.status === 'error' ? 'bg-red-500' : isProcessing ? 'bg-[#1E90FF] animate-pulse' : 'bg-[#1E90FF]'}\`}
                            style={{ width: \`\${dl.status === 'completed' || isProcessing ? 100 : dl.progress * 100}%\` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white/60 min-w-[35px] text-right">
                          {dl.status === 'completed' || isProcessing ? '100%' : \`\${Math.round(dl.progress * 100)}%\`}
                        </span>
                      </div>
                      <p className={\`text-[10px] font-bold mt-1 uppercase tracking-wider \${dl.status === 'completed' ? 'text-[#1DB954]' : dl.status === 'error' ? 'text-red-500' : 'text-[#1E90FF]'}\`}>
                        {getStatusText(dl.status)}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Completed Tracks (Offline Library) */}
              {(filter === 'all' || filter === 'completed') && offlineTracks.map((track) => (
                <div 
                  key={track.id} 
                  className="bg-white/5 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 border border-white/5 cursor-pointer group hover:bg-white/10 transition-colors"
                  onClick={() => playTrack({ ...track, streamUrl: Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(track.localPath) : track.localPath })}
                >
                  <div className="relative w-[60px] h-[60px] bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                    {track.album?.image?.small || track.image?.small ? (
                      <img src={track.album?.image?.small || track.image?.small} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <Music className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-white truncate mb-0.5">
                      {track.title}
                    </h4>
                    <p className="text-xs text-white/60 truncate">
                      {track.artist?.name || track.performer?.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 pr-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 group-hover:bg-[#1DB954] group-hover:text-white transition-colors">
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/LibraryTab.tsx', code);
console.log("Patched LibraryTab with the old design!");
