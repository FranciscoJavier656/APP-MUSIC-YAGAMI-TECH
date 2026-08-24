import { useState, useEffect } from 'react';
import { Search, Sparkles, Settings as SettingsIcon, Terminal } from 'lucide-react';
import SearchTab from './components/SearchTab';
import AssistantTab from './components/AssistantTab';
import SettingsTab from './components/SettingsTab';
import LogsTab from './components/LogsTab';
import { PlayerProvider } from './components/PlayerContext';
import MiniPlayer from './components/MiniPlayer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'assistant' | 'settings' | 'logs'>('search');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

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
    <PlayerProvider>
      <div className="flex flex-col h-screen bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans sm:pb-0 overflow-hidden transition-colors duration-300">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-[88px] relative">
          {activeTab === 'search' && <SearchTab />}
          {activeTab === 'assistant' && <AssistantTab />}
          {activeTab === 'settings' && <SettingsTab isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          {activeTab === 'logs' && <LogsTab />}
        </main>

        {/* Mini Player */}
        <MiniPlayer />

        {/* iOS Style Bottom Tab Bar */}
        <nav className="absolute bottom-0 w-full h-[88px] bg-[#F9F9F9]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-gray-300 dark:border-gray-800 flex justify-around items-start pt-3 z-50 transition-colors duration-300">
          <div className="flex justify-around items-start w-full max-w-md mx-auto px-4">
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
              onClick={() => setActiveTab('assistant')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'assistant' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Sparkles size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Asistente</span>
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'logs' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Terminal size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Logs</span>
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
  );
}
