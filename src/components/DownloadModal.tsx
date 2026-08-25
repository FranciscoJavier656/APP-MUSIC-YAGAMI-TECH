import { getQobuzAlbum, getQobuzTrackUrl } from "../lib/qobuz";
import { downloadTrackRouted } from "../lib/DownloadManager";
import { useDownloads } from "../lib/DownloadContext";
import { Capacitor } from '@capacitor/core';
import { useState } from 'react';
import { X, Download, Loader2, Music, CheckCircle, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

interface DownloadModalProps {
  item: any;
  type: 'album' | 'track';
  onClose: () => void;
}

export default function DownloadModal({ item, type, onClose }: DownloadModalProps) {
  const [format, setFormat] = useState('5');
  const [status, setStatus] = useState<'idle' | 'fetching' | 'downloading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { addDownload } = useDownloads();

    

  const handleDownload = async () => {
    setStatus('fetching');
    try {
      let tracksToDownload: any[] = [];
      let albumTitle = 'Album';

      if (type === 'album') {
        const albumData = await getQobuzAlbum(item.id.toString());
        tracksToDownload = albumData.tracks?.items || [];
        albumTitle = albumData.title || 'Album';
      } else {
        tracksToDownload = [item];
      }

      setProgress({ current: 0, total: tracksToDownload.length });
      setStatus('downloading');

      const ext = format === '5' ? 'mp3' : 'flac';

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          if (Capacitor.isNativePlatform()) {
            addDownload(track.id.toString(), track);
          }
          const success = await downloadTrackRouted(track, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }
          
          if (!Capacitor.isNativePlatform()) {
             // Delay slightly between tracks on Web only since native is async queued
             await new Promise(r => setTimeout(r, 1000));
          }
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }
      
      setStatus('done');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                {(() => {
                const src = item.album?.image?.small || item.album?.image?.large || item.image?.small || item.image?.large || item.image?.thumbnail || (typeof item.image === 'string' ? item.image : '');
                return src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {type === 'album' ? <Disc /> : <Music />}
                  </div>
                );
              })()}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-black dark:text-white truncate max-w-[200px]">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {type === 'album' ? 'Album' : 'Track'} • {item.artist?.name || item.performer?.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Calidad de Descarga
                </label>
                <div className="space-y-2">
                  {[
                    { id: '5', label: 'MP3', desc: '320 kbps (Standard)' },
                    { id: '6', label: 'FLAC', desc: '16-Bit / 44.1 kHz (CD)' },
                    { id: '27', label: 'FLAC Hi-Res', desc: '24-Bit / up to 192 kHz' }
                  ].map((f) => (
                    <label 
                      key={f.id} 
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${
                        format === f.id 
                          ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="format" 
                        value={f.id} 
                        checked={format === f.id} 
                        onChange={(e) => setFormat(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${format === f.id ? 'text-[#007AFF]' : 'text-black dark:text-white'}`}>
                          {f.label}
                        </p>
                        <p className={`text-xs ${format === f.id ? 'text-[#007AFF]/80' : 'text-gray-500 dark:text-gray-400'}`}>
                          {f.desc}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        format === f.id ? 'border-[#007AFF]' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {format === f.id && <div className="w-2.5 h-2.5 bg-[#007AFF] rounded-full" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-[#007AFF] text-white font-semibold py-3.5 rounded-xl hover:bg-[#0066D6] transition-colors"
              >
                <Download className="w-5 h-5" />
                Descargar {type === 'album' ? 'Album' : 'Track'}
              </button>
            </div>
          )}

          {(status === 'fetching' || status === 'downloading') && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#007AFF] mb-4" />
              <p className="font-semibold text-black dark:text-white">
                {status === 'fetching' ? 'Preparando enlaces...' : 'Descargando...'}
              </p>
              {status === 'downloading' && progress.total > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Track {progress.current} of {progress.total}
                </p>
              )}
            </div>
          )}

          {status === 'done' && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <p className="font-bold text-xl text-black dark:text-white">¡Completado!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                La descarga ha finalizado.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full font-semibold py-3 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-xl"
              >
                Cerrar
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <p className="font-bold text-red-500 mb-2">Error</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hubo un problema al procesar la descarga. Asegúrate de tener una suscripción activa y tus credenciales configuradas.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-6 w-full font-semibold py-3 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-xl"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
