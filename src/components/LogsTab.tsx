import { useState, useEffect, useRef } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { Terminal } from 'lucide-react';

const QobuzAudio = registerPlugin('QobuzAudioPlugin');

interface LogMessage {
  time: string;
  message: string;
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escuchar los eventos del plugin nativo
    let listener: any = null;
    
    const initListener = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          listener = await QobuzAudio.addListener('onDebugLog', (data: any) => {
            const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any);
            setLogs(prev => [...prev, { time: timeStr, message: data.message }]);
          });
        } else {
          setLogs([{ time: new Date().toLocaleTimeString(), message: 'Web environment detected. Native logs will not be available.'}]);
        }
      } catch (e) {
        console.warn('Failed to attach native listener', e);
      }
    };

    initListener();

    return () => {
      if (listener) {
        listener.remove().catch(console.warn);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#1C1C1E] text-green-400 font-mono p-4 pb-12">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Terminal size={20} className="text-green-500" />
          <h2 className="text-lg font-bold text-white">Consola de Audio</h2>
        </div>
        <button 
          onClick={clearLogs}
          className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition"
        >
          Limpiar
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-black rounded-md border border-gray-800 p-4 font-mono text-xs overflow-y-auto"
      >
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Esperando logs nativos...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 break-words">
              <span className="text-gray-500">[{log.time}]</span>{' '}
              <span className={`${log.message.toLowerCase().includes('error') || log.message.toLowerCase().includes('fail') ? 'text-red-500' : 'text-green-400'}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
