import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Music, AlertCircle, Play, Disc } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { useDownloads } from '../lib/DownloadContext';
import { Download } from 'lucide-react';

export default function LibraryTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack } = usePlayer();
  const { activeDownloads } = useDownloads();
  const activeDownloadList = Object.values(activeDownloads);

  const loadOfflineLibrary = () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        setIsLoading(false);
        return;
      }
      
      const tracksStr = localStorage.getItem('offline_tracks');
      if (tracksStr) {
        const tracksObj = JSON.parse(tracksStr);
        // Convert object to array and sort by downloadedAt descending
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

    const handleUpdate = () => {
      loadOfflineLibrary();
    };

    window.addEventListener('offline-library-updated', handleUpdate);
    return () => {
      window.removeEventListener('offline-library-updated', handleUpdate);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#F2F2F7] dark:bg-black pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-black pb-24">
      <div className="p-4 pt-14">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2 tracking-tight">Tu Librería</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Música descargada disponible offline</p>

        {activeDownloadList.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-black dark:text-white mb-3 px-1">Descargas Activas</h2>
            <div className="space-y-3">
              {activeDownloadList.map((dl) => {
                const getStatusText = (status: string) => {
                  switch(status) {
                    case 'queued': return 'En cola...';
                    case 'downloading': return 'Descargando archivo...';
                    case 'processing_metadata': return 'Incrustando metadatos (FLAC)...';
                    case 'importing_library': return 'Importando a librería offline...';
                    case 'organizing': return 'Organizando categorías...';
                    case 'completed': return '¡Completado exitosamente!';
                    case 'error': return 'Error en descarga';
                    default: return 'Procesando...';
                  }
                };

                const isProcessing = ['processing_metadata', 'importing_library', 'organizing'].includes(dl.status);

                return (
                  <div key={dl.trackId} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        {dl.trackMetadata?.album?.image?.small || dl.trackMetadata?.image?.small ? (
                          <img src={dl.trackMetadata.album?.image?.small || dl.trackMetadata.image?.small} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Download className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-black dark:text-white truncate">{dl.trackMetadata?.title || 'Unknown Track'}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{dl.trackMetadata?.artist?.name || 'Unknown Artist'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-bold ${dl.status === 'completed' ? 'text-green-500' : 'text-[#007AFF]'}`}>
                          {dl.status === 'completed' || isProcessing ? '100%' : `${Math.round(dl.progress * 100)}%`}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-xs font-medium mb-2 ${dl.status === 'error' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {getStatusText(dl.status)}
                    </p>

                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${dl.status === 'completed' ? 'bg-green-500' : isProcessing ? 'bg-[#007AFF] animate-pulse' : 'bg-[#007AFF]'}`} 
                        style={{ width: `${dl.status === 'completed' || isProcessing ? 100 : dl.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {offlineTracks.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Disc className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">Librería Vacía</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-[250px]">
              No tienes pistas descargadas aún. Las descargas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#2C2C2E]">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pistas ({offlineTracks.length})
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {offlineTracks.map((track) => (
                <div 
                  key={track.id} 
                  className="p-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  onClick={() => playTrack({ ...track, streamUrl: Capacitor.convertFileSrc(track.localPath) })}
                >
                  <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                    {track.album?.image?.small || track.image?.small ? (
                      <img src={track.album?.image?.small || track.image?.small} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Music className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-black dark:text-white truncate">
                      {track.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {track.artist?.name || track.performer?.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 pr-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
