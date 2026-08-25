import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Music, AlertCircle, Play, Disc } from 'lucide-react';
import { usePlayer } from './PlayerContext';

export default function LibraryTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack } = usePlayer();

  useEffect(() => {
    const loadOfflineLibrary = async () => {
      try {
        if (!Capacitor.isNativePlatform()) {
          // On Web, simulate empty or provide feedback
          setIsLoading(false);
          return;
        }
        
        // This is where Capacitor SQLite query will live once integrated natively
        // e.g. const db = await sqlite.createConnection(...)
        // const result = await db.query('SELECT * FROM tracks')
        
        // Temporary mock for UI structure
        setOfflineTracks([]); 
      } catch (e) {
        console.error("Error loading offline library:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOfflineLibrary();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#F2F2F7] dark:bg-black pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#F2F2F7] dark:bg-black overflow-y-auto pb-32">
      <div className="px-6 pt-16 pb-8 bg-white dark:bg-[#1C1C1E] shadow-sm mb-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold text-black dark:text-white">Tu Librería</h1>
        <p className="text-gray-500 mt-2 font-medium">Música descargada disponible offline</p>
      </div>

      <div className="px-6">
        {!Capacitor.isNativePlatform() ? (
          <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#007AFF]" />
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Modo Web</h3>
            <p className="text-gray-500 text-sm">
              La librería offline y las descargas en segundo plano están optimizadas exclusivamente para la versión nativa de iOS.
            </p>
          </div>
        ) : offlineTracks.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Disc className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Librería Vacía</h3>
            <p className="text-gray-500 text-sm">
              No tienes pistas descargadas aún. Las descargas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {offlineTracks.map((track) => (
              <div 
                key={track.id} 
                className="flex items-center gap-4 bg-white dark:bg-[#1C1C1E] p-3 rounded-2xl shadow-sm"
                onClick={() => playTrack(track)}
              >
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                  {track.image ? (
                    <img src={track.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-black dark:text-white truncate">{track.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{track.artist?.name || track.artist}</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#007AFF]">
                  <Play className="w-4 h-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
