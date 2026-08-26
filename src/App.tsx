import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';
import { YagamiLoader } from './components/YagamiLoader';
import HomeTab from './components/HomeTab';
import SearchTab from './components/SearchTab';
import SettingsTab from './components/SettingsTab';
import LibraryTab from './components/LibraryTab';
import DownloadsTab from './components/DownloadsTab';
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
        <main className="flex-1 overflow-y-auto pb-[88px] relative">
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

        {/* Mini Player */}
        <MiniPlayer />

        {/* iOS Style Bottom Tab Bar */}
        <nav className="absolute bottom-0 w-full h-[88px] bg-[#F9F9F9]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-gray-300 dark:border-gray-800 flex justify-around items-start pt-3 z-50 transition-colors duration-300">
          <div className="flex justify-around items-start w-full max-w-md mx-auto px-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'home' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Home size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Inicio</span>
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'search' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Search size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Buscar</span>
            </button>
            
            <button
              onClick={() => setActiveTab('library')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'library' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Library size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Librería</span>
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'downloads' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Download size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Descargas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'settings' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <SettingsIcon size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Ajustes</span>
            </button>
          </div>
        </nav>
      </div>
    </PlayerProvider>
    </DownloadProvider>
  );
}
