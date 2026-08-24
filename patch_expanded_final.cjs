const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add states for touch, queue, and lyrics loading
const oldState = `  const [showLyrics, setShowLyrics] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);`;
const newState = `  const [showLyrics, setShowLyrics] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [lyrics, setLyrics] = useState<string>("Cargando letras...");
  
  // Swipe gesture state
  const [touchStartY, setTouchStartY] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    if (currentY - touchStartY > 100) {
      setIsExpanded(false);
      setTouchStartY(0);
    }
  };
  const handleTouchEnd = () => setTouchStartY(0);`;
code = code.replace(oldState, newState);

// 2. Fetch Lyrics Effect
const oldImports = `import { QobuzAudio } from '../lib/QobuzAudioPlugin';`;
const newImports = `import { QobuzAudio } from '../lib/QobuzAudioPlugin';
import { chatWithGemini } from '../lib/gemini';`;
code = code.replace(oldImports, newImports);

const oldEffect = `  }, [currentTrack?.image]);`;
const newEffect = `  }, [currentTrack?.image]);

  useEffect(() => {
    if (currentTrack && showLyrics) {
      setLyrics("Buscando letras...");
      chatWithGemini(\`Por favor, dame las letras de la canción "\${currentTrack.title}" de "\${currentTrack.artist}". Devuelve ÚNICAMENTE la letra de la canción, sin introducciones ni formato extra. Si no la encuentras, devuelve "Letras no encontradas."\`)
        .then(res => setLyrics(res || "Letras no encontradas."))
        .catch(() => setLyrics("Letras no disponibles."));
    }
  }, [currentTrack, showLyrics]);`;
code = code.replace(oldEffect, newEffect);

// 3. Attach gesture handlers to main container
const oldContainer = `<div
      className={\`fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col pt-12 pb-8 px-6 sm:px-12 transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] \${isExpanded ? 'translate-y-0' : 'translate-y-full'}\`}
    >`;
const newContainer = `<div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={\`fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col pt-12 pb-8 px-6 sm:px-12 transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] \${isExpanded ? 'translate-y-0' : 'translate-y-full'}\`}
    >`;
code = code.replace(oldContainer, newContainer);

// 4. Update the Queue button logic
const oldHeaderBtn = `<button className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <ListMusic className="w-6 h-6 text-black dark:text-white" />
        </button>`;
const newHeaderBtn = `<button onClick={() => setShowQueue(true)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <ListMusic className="w-6 h-6 text-black dark:text-white" />
        </button>`;
code = code.replace(oldHeaderBtn, newHeaderBtn);

// 5. Update Lyrics Rendering
const oldLyricsContent = `<p className="text-white/90 text-lg leading-relaxed font-medium mt-8">
                 🎶<br/><br/>
                 (Sincronización de letras no disponible para esta pista local)<br/><br/>
                 ...
              </p>`;
const newLyricsContent = `<div className="text-white/90 text-lg leading-relaxed font-medium mt-4 whitespace-pre-wrap pb-12">
                {lyrics}
              </div>`;
code = code.replace(oldLyricsContent, newLyricsContent);

// 6. Add Queue UI at the end
const oldEnd = `    </div>
  );
}`;
const newEnd = `      {/* Queue Modal */}
      {showQueue && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom-8">
          <div className="flex items-center justify-between mb-6 pt-6">
            <h3 className="text-2xl font-bold text-black dark:text-white">A continuación</h3>
            <button onClick={() => setShowQueue(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-20 space-y-4">
            {queue.map((track, idx) => {
              const isPlayingQueue = currentTrack?.id === track.id;
              return (
                <div key={idx} className={\`flex items-center gap-4 p-3 rounded-2xl \${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}\`}>
                  <img src={track.image} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className={\`font-bold truncate \${isPlayingQueue ? 'text-black dark:text-white' : 'text-black/80 dark:text-white/80'}\`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-black/50 dark:text-white/50 truncate">{track.artist}</p>
                  </div>
                  {isPlayingQueue && (
                    <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite] h-2"></div>
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_100ms] h-4"></div>
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_200ms] h-3"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}`;
code = code.replace(oldEnd, newEnd);

// Also need to get \`queue\` from \`usePlayer\`
const oldUsePlayer = `    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
    audioRef
  } = usePlayer();`;
const newUsePlayer = `    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
    audioRef, queue
  } = usePlayer();`;
code = code.replace(oldUsePlayer, newUsePlayer);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
