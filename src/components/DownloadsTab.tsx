import React, { useState, useEffect, useMemo } from 'react';
import { OfflineImage } from './OfflineImage';
import { getImageSrc } from '../lib/image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { motion } from 'motion/react';
import { Music, Play, Disc, Trash2, Heart, ListMusic, User, Search, Filter, Download, AlertCircle, Database, CheckCircle, Clock, Pause, RotateCcw, X } from 'lucide-react';
import { usePlayer } from './PlayerContext';


import { useDownloads } from '../lib/DownloadContext';

export default function DownloadsTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'downloading' | 'completed' | 'error'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { playTrack } = usePlayer();
  const { activeDownloads } = useDownloads();
  const activeDownloadList = Object.values(activeDownloads);

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

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const downloads = useMemo(() => {
    const active = activeDownloadList.map((dl: any) => ({
      id: dl.trackId,
      track: dl.trackMetadata,
      progress: dl.progress * 100, // 0 to 100
      status: dl.status,
      error: dl.error
    }));

    const completed = offlineTracks.map(track => ({
      id: track.id.toString(),
      track: track,
      progress: 100,
      status: 'completed'
    }));

    // Filter out completed ones that are still in active downloads (the 3s delay)
    const activeIds = new Set(active.map(a => a.id.toString()));
    const filteredCompleted = completed.filter(c => !activeIds.has(c.id));

    return [...active, ...filteredCompleted];
  }, [activeDownloadList, offlineTracks]);

  const stats = useMemo(() => {
    const active = downloads.filter(d => ['downloading', 'queued', 'processing_metadata', 'importing_library', 'organizing'].includes(d.status));
    const completed = downloads.filter(d => d.status === 'completed');
    const errors = downloads.filter(d => d.status === 'error');
    
    // Calculate total size (mock for now since we don't store file size in offline_tracks yet)
    // Use actual bytes if possible, else just 0
    const totalSize = completed.reduce((acc, item) => acc + (item.track?.sizeBytes || (item.progress as any)?.bytes || 0), 0);

    return {
      totalDownloads: downloads.length,
      activeDownloads: active.length,
      completedDownloads: completed.length,
      totalSize: totalSize,
      errors: errors.length,
    };
  }, [downloads]);

  const filteredDownloads = useMemo(() => {
    if (filter === 'all') return downloads;
    if (filter === 'completed') return downloads.filter(d => d.status === 'completed');
    if (filter === 'error') return downloads.filter(d => d.status === 'error');
    if (filter === 'downloading') return downloads.filter(d => ['downloading', 'queued', 'processing_metadata', 'importing_library', 'organizing'].includes(d.status));
    return downloads;
  }, [downloads, filter]);

    const removeTrack = async (trackId: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta descarga?")) {
      try {
        const tracksStr = localStorage.getItem('offline_library_tracks');
        if (tracksStr) {
          const tracksObj = JSON.parse(tracksStr);
          if (tracksObj[trackId]) {
              const lp = tracksObj[trackId].original?.localPath || tracksObj[trackId].localPath;
              delete tracksObj[trackId];
              localStorage.setItem('offline_library_tracks', JSON.stringify(tracksObj));
              
              if (lp) {
                  try {
                      await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                  } catch(e){}
              }
          }
        }
        
        const oldStr = localStorage.getItem('offline_tracks');
        if (oldStr) {
           const oldObj = JSON.parse(oldStr);
           delete oldObj[trackId];
           localStorage.setItem('offline_tracks', JSON.stringify(oldObj));
        }
        
        loadOfflineLibrary();
      } catch (e) {}
    }
  };

  const clearCompleted = () => {
    if (window.confirm("¿Seguro que deseas eliminar TODAS las descargas completadas?")) {
      localStorage.removeItem('offline_tracks');
      setOfflineTracks([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
      case 'processing_metadata':
      case 'importing_library':
      case 'organizing':
        return Download;
      case 'completed':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'queued':
        return Clock;
      default:
        return Database;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
      case 'processing_metadata':
      case 'importing_library':
      case 'organizing':
        return '#1E90FF';
      case 'completed':
        return '#1DB954';
      case 'error':
        return '#FF4444';
      case 'queued':
        return '#9B59B6';
      default:
        return 'rgba(255,255,255,0.4)';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#000] pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E90FF]"></div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="flex-1 mx-4 overflow-hidden rounded-[20px] mb-24 mt-4">
      <div className="flex-1 h-full bg-[#1E90FF]/5 backdrop-blur-[20px] flex flex-col items-center justify-center p-10 border border-[#1E90FF]/10">
        <Download className="w-20 h-20 text-[#1E90FF]/30" />
        <h3 className="text-2xl font-bold text-white mt-5 mb-2 text-center">
          Sin descargas
        </h3>
        <p className="text-white/60 text-sm text-center mb-6">
          Descarga música para escucharla sin conexión
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

  return (
    <div className="h-full w-full overflow-y-auto bg-black pb-[180px]">
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-black pointer-events-none" />
      
      <div className="relative pt-[10px] flex flex-col min-h-full">
        {stats.totalDownloads > 0 ? (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 mx-4 overflow-hidden rounded-[20px] backdrop-blur-[30px] mb-2"
            >
              <div className="bg-gradient-to-br from-white/5 to-black/80 p-5 border border-white/5">
                
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h1 className="text-[32px] font-bold text-white mb-1">Descargas</h1>
                    <p className="text-sm text-white/60">
                      Gestiona tu almacenamiento
                    </p>
                  </div>
                  {stats.completedDownloads = 0 && (
                    <button 
                      onClick={clearCompleted}
                      className="overflow-hidden rounded-xl"
                    >
                      <div className="flex items-center gap-1.5 p-3 backdrop-blur-[40px] bg-red-500/10 border border-red-500/20">
                        <Trash2 size={20} color="#FF4444" />
                        <span className="text-[#FF4444] text-sm font-semibold hidden sm:inline">Limpiar Completadas</span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="flex gap-3 mb-5">
                  <div className="flex-1 overflow-hidden rounded-2xl">
                    <div className="p-4 bg-white/5 backdrop-blur-[15px] flex flex-col items-center gap-2 border border-white/5">
                      <Download size={24} color="#1E90FF" />
                      <span className="text-xl font-bold text-white">{stats.activeDownloads}</span>
                      <span className="text-[11px] text-white/60 uppercase tracking-wider font-semibold">Activas</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-2xl">
                    <div className="p-4 bg-white/5 backdrop-blur-[15px] flex flex-col items-center gap-2 border border-white/5">
                      <CheckCircle size={24} color="#1DB954" />
                      <span className="text-xl font-bold text-white">{stats.completedDownloads}</span>
                      <span className="text-[11px] text-white/60 uppercase tracking-wider font-semibold">Completadas</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-2xl">
                    <div className="p-4 bg-white/5 backdrop-blur-[15px] flex flex-col items-center gap-2 border border-white/5">
                      <Database size={24} color="#FFA500" />
                      <span className="text-xl font-bold text-white">{formatBytes(stats.totalSize)}</span>
                      <span className="text-[11px] text-white/60 uppercase tracking-wider font-semibold">Total</span>
                    </div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <button onClick={() => setFilter('all')} className={`overflow-hidden rounded-full ${filter === 'all' ? 'bg-[#1DB954]' : 'bg-white/10'}`}>
                    <div className="px-4 py-2 flex items-center justify-center">
                      <span className={`text-[13px] font-semibold ${filter === 'all' ? 'text-white' : 'text-white/60'}`}>Todas</span>
                    </div>
                  </button>
                  <button onClick={() => setFilter('downloading')} className={`overflow-hidden rounded-full ${filter === 'downloading' ? 'bg-[#1DB954]' : 'bg-white/10'}`}>
                    <div className="px-4 py-2 flex items-center justify-center">
                      <span className={`text-[13px] font-semibold ${filter === 'downloading' ? 'text-white' : 'text-white/60'}`}>Descargando</span>
                    </div>
                  </button>
                  <button onClick={() => setFilter('completed')} className={`overflow-hidden rounded-full ${filter === 'completed' ? 'bg-[#1DB954]' : 'bg-white/10'}`}>
                    <div className="px-4 py-2 flex items-center justify-center">
                      <span className={`text-[13px] font-semibold ${filter === 'completed' ? 'text-white' : 'text-white/60'}`}>Completadas</span>
                    </div>
                  </button>
                  <button onClick={() => setFilter('error')} className={`overflow-hidden rounded-full ${filter === 'error' ? 'bg-[#1DB954]' : 'bg-white/10'}`}>
                    <div className="px-4 py-2 flex items-center justify-center">
                      <span className={`text-[13px] font-semibold ${filter === 'error' ? 'text-white' : 'text-white/60'}`}>Errores</span>
                    </div>
                  </button>
                </div>

              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 pb-[180px] space-y-3"
            >
              {filteredDownloads.map((item, idx) => {
                const StatusIcon = getStatusIcon(item.status);
                const statusColor = getStatusColor(item.status);
                const isProcessing = ['downloading', 'processing_metadata', 'importing_library', 'organizing'].includes(item.status);

                const getProcessingText = (s: string) => {
                   if(s === 'processing_metadata') return 'Escribiendo metadatos...';
                   if(s === 'importing_library') return 'Importando...';
                   if(s === 'organizing') return 'Organizando...';
                   return '';
                };

                return (
                  <div key={item.id || idx} className="mb-3">
                    <div className="overflow-hidden rounded-2xl backdrop-blur-[15px] bg-white/5 border border-white/5">
                      <div className="flex p-3 gap-3">
                        {/* Album Art */}
                        <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                          {item.track?.album?.image?.small || item.track?.image?.small || item.track?.image ? (
                            <OfflineImage localPath={item.track?.localCoverPath} remoteUrl={getImageSrc(item.track?.album?.image || item.track?.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              <Music className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <h4 className="text-base font-bold text-white truncate">{item.track?.title || 'Unknown'}</h4>
                          <p className="text-[13px] text-white/60 truncate">{item.track?.artist?.name || item.track?.performer?.name || 'Unknown Artist'}</p>
                          
                          {/* Barra de progreso */}
                          {(isProcessing || item.status === 'queued') && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${item.status === 'queued' ? 'bg-[#9B59B6]' : 'bg-[#1E90FF]'}`}
                                  style={{ width: `${Math.round(item.progress)}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-white/60 min-w-[35px] text-right">
                                {item.status === 'queued' ? 'Cola' : `${Math.round(item.progress)}%`}
                              </span>
                            </div>
                          )}

                          {/* Info Adicional */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.status === 'queued' && (
                              <span className="text-[11px] text-white/50">Esperando para descargar...</span>
                            )}
                            {item.status === 'downloading' && (
                              <span className="text-[11px] text-white/50">Descargando...</span>
                            )}
                            {item.status === 'completed' && (
                              <span className="text-[11px] text-[#1DB954] font-medium uppercase tracking-wider">Completado {item.track?.sizeBytes ? `• ${formatBytes(item.track.sizeBytes)}` : ''}</span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-[11px] text-[#FF4444] font-medium truncate">{(item as any).error || 'Error en descarga'}</span>
                            )}
                            {isProcessing && item.status !== 'downloading' && (
                               <span className="text-[11px] text-[#1E90FF]">{getProcessingText(item.status)}</span>
                            )}
                          </div>
                        </div>

                        {/* Controles */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Status Badge */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${statusColor}20` }}>
                            <StatusIcon size={16} color={statusColor} />
                          </div>

                          {item.status === 'completed' && (
                            <button 
                              onClick={() => {
                                const trackToPlay = { 
                                  ...item.track, 
                                  localPath: item.track.localPath 
                                };
                                const queueToPlay = downloads.filter((d: any) => d.status === 'completed' && d.track).map((d: any) => ({
                                  ...d.track,
                                  localPath: d.track.localPath
                                }));
                                playTrack(trackToPlay, queueToPlay);
                              }}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1DB954] group transition-colors"
                            >
                              <Play size={16} className="text-[#1DB954] group-hover:text-white fill-current ml-0.5" />
                            </button>
                          )}

                          <button 
                            onClick={() => {
                               if (item.status === 'completed') {
                                  removeTrack(item.id);
                               }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-white/10 hover:bg-red-500 group' : 'opacity-0 pointer-events-none'}`}
                          >
                            <Trash2 size={16} className="text-white/60 group-hover:text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
