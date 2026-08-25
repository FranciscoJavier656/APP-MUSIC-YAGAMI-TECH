import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

export interface ActiveDownload {
  trackId: string;
  progress: number;
  status: 'queued' | 'downloading' | 'processing_metadata' | 'importing_library' | 'organizing' | 'completed' | 'error';
  trackMetadata: any;
  error?: string;
}

interface DownloadContextType {
  activeDownloads: { [trackId: string]: ActiveDownload };
  addDownload: (trackId: string, trackMetadata: any) => void;
  removeDownload: (trackId: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [activeDownloads, setActiveDownloads] = useState<{ [trackId: string]: ActiveDownload }>({});

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let progressListener: any;
    let completedListener: any;
    let errorListener: any;
    let startedListener: any;

        let stateListener: any;
    const setupListeners = async () => {
      const { Plugins } = await import('@capacitor/core') as any;
      const YagamiManager = Plugins.YagamiDownloadManager;

      if (!YagamiManager) return;

      startedListener = await YagamiManager.addListener('onDownloadStarted', (data: any) => {
        setActiveDownloads(prev => {
          if (!prev[data.trackId]) return prev;
          return {
            ...prev,
            [data.trackId]: { ...prev[data.trackId], status: 'downloading', progress: 0 }
          };
        });
      });

      progressListener = await YagamiManager.addListener('onDownloadProgress', (data: any) => {
        setActiveDownloads(prev => {
          if (!prev[data.trackId]) return prev;
          return {
            ...prev,
            [data.trackId]: { ...prev[data.trackId], status: 'downloading', progress: data.progress }
          };
        });
      });

      completedListener = await YagamiManager.addListener('onDownloadCompleted', (data: any) => {
        setActiveDownloads(prev => {
          if (!prev[data.trackId]) return prev;
          return {
            ...prev,
            [data.trackId]: { ...prev[data.trackId], status: 'completed', progress: 1 }
          };
        });
        
        // After 3 seconds, remove from active downloads
        setTimeout(() => {
          setActiveDownloads(prev => {
            const next = { ...prev };
            delete next[data.trackId];
            return next;
          });
          // Note: In a real app we'd refresh the SQLite library here
          window.dispatchEvent(new CustomEvent('offline-library-updated'));
        }, 3000);
      });

      stateListener = await YagamiManager.addListener('onDownloadStateChange', (data: any) => {
        setActiveDownloads(prev => {
          if (!prev[data.trackId]) return prev;
          return {
            ...prev,
            [data.trackId]: { ...prev[data.trackId], status: data.status, progress: 1 } // Mantener al 100% durante el procesamiento
          };
        });
      });

      errorListener = await YagamiManager.addListener('onDownloadError', (data: any) => {
        setActiveDownloads(prev => {
          if (!prev[data.trackId]) return prev;
          return {
            ...prev,
            [data.trackId]: { ...prev[data.trackId], status: 'error', error: data.error }
          };
        });
      });
    };

    setupListeners();

    return () => {
      if (startedListener) startedListener.remove();
      if (progressListener) progressListener.remove();
      if (completedListener) completedListener.remove();
      if (errorListener) errorListener.remove();
      if (stateListener) stateListener.remove();
    };
  }, []);

  const addDownload = (trackId: string, trackMetadata: any) => {
    setActiveDownloads(prev => ({
      ...prev,
      [trackId]: {
        trackId,
        progress: 0,
        status: 'queued',
        trackMetadata
      }
    }));
  };

  const removeDownload = (trackId: string) => {
    setActiveDownloads(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
  };

  return (
    <DownloadContext.Provider value={{ activeDownloads, addDownload, removeDownload }}>
      {children}
    </DownloadContext.Provider>
  );
}

export const useDownloads = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownloads must be used within a DownloadProvider');
  }
  return context;
};
