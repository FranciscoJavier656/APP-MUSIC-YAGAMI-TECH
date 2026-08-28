import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';
import { YagamiLoader } from './components/YagamiLoader';
import HomeTab from './components/HomeTab';
import SearchTab from './components/SearchTab';
import SettingsTab from './components/SettingsTab';
import LibraryTab from './components/LibraryTab';
import DownloadsTab from './components/DownloadsTab';
import AlbumView from './components/AlbumView';
import PlaylistView from './components/PlaylistView';
import ArtistView from './components/ArtistView';

import { PlayerProvider } from './components/PlayerContext';
import { DownloadProvider } from './lib/DownloadContext';
import { WifiOff } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import MiniPlayer from './components/MiniPlayer';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);

  useEffect(() => {
    const handleGlobalOverlay = (e: any) => {
      setGlobalOverlay(e.detail);
    };
    document.addEventListener('open-overlay', handleGlobalOverlay);
    return () => document.removeEventListener('open-overlay', handleGlobalOverlay);
  }, []);


  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    document.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      document.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
         (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <DownloadProvider>
    <PlayerProvider>
      <div className="flex flex-col h-screen w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans sm:pb-0 overflow-hidden transition-colors duration-300 relative">
        <AnimatePresence>
          {isAppLoading && (
            <motion.div 
              key="loader"
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="flex flex-col h-screen w-screen bg-[#F2F2F7] dark:bg-[#000000] items-center justify-center absolute inset-0 z-[100]"
            >
              <YagamiLoader />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-[90] bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <WifiOff size={14} />
              Sin Conexión
            </motion.div>
          )}
        </AnimatePresence>
        <ErrorBoundary>
        <main className="flex-1 relative overflow-hidden">
          <div className={activeTab === 'home' ? 'block h-full' : 'hidden'}>
            <HomeTab />
          </div>
          <div className={activeTab === 'search' ? 'block h-full' : 'hidden'}>
            <SearchTab />
          </div>
          <div className={activeTab === 'library' ? 'block h-full' : 'hidden'}>
            <LibraryTab />
          </div>
          <div className={activeTab === 'downloads' ? 'block h-full' : 'hidden'}>
            <DownloadsTab />
          </div>
          <div className={activeTab === 'settings' ? 'block h-full' : 'hidden'}>
            <SettingsTab isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </div>
        </main>
        </ErrorBoundary>

        <MiniPlayer />
        <AnimatePresence>
          {globalOverlay && globalOverlay.type === 'album' && (
            <motion.div 
              key="global-album"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <AlbumView albumId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
          {globalOverlay && globalOverlay.type === 'playlist' && (
            <motion.div 
              key="global-playlist"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <PlaylistView playlistId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
          {globalOverlay && globalOverlay.type === 'artist' && (
            <motion.div 
              key="global-artist"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <ArtistView artistId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Player */}

        <MiniPlayer />

        {/* Docked Modern Tab Bar with Pills */}
        <nav className="absolute bottom-0 left-0 w-full h-[72px] bg-[#F2F2F7]/95 dark:bg-[#000000]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 flex justify-center z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between w-full max-w-[450px] px-3 h-full">
            {[
              { id: 'home', icon: Home, label: 'Inicio' },
              { id: 'search', icon: Search, label: 'Buscar' },
              { id: 'library', icon: Library, label: 'Librería' },
              { id: 'downloads', icon: Download, label: 'Descargas' },
              { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full transition-all duration-300 ease-out ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 bg-[#007AFF] rounded-full z-0 shadow-md"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                  {isActive && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative z-10 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </PlayerProvider>
    </DownloadProvider>
  );
}
