const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add new icons to import
const oldImport = `import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';`;
const newImport = `import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, ListMusic, Info } from 'lucide-react';`;
code = code.replace(oldImport, newImport);

// 2. Add state for Lyrics and Metadata
const oldState = `  const [dominantColor, setDominantColor] = useState<string | null>(null);`;
const newState = `  const [dominantColor, _setDominantColor] = useState<string | null>(null);
  const dominantColorRef = useRef<string | null>(null);
  const setDominantColor = (color: string | null) => {
    dominantColorRef.current = color;
    _setDominantColor(color);
  };
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);`;
code = code.replace(oldState, newState);

// 3. Update Canvas to use dominantColorRef
const oldCanvasColor = `          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const baseRgb = isDarkMode ? '255, 255, 255' : '0, 0, 0';`;
const newCanvasColor = `          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          let r = isDarkMode ? 255 : 0;
          let g = isDarkMode ? 255 : 0;
          let b = isDarkMode ? 255 : 0;
          
          if (dominantColorRef.current) {
            const match = dominantColorRef.current.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
            if (match) {
              r = parseInt(match[1]);
              g = parseInt(match[2]);
              b = parseInt(match[3]);
            }
          }
          const baseRgb = \`\${r}, \${g}, \${b}\`;`;
code = code.replace(oldCanvasColor, newCanvasColor);

// 4. Update Header with Up Next button
const oldHeader = `        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
          REPRODUCIENDO DESDE<br/>
          <span className="text-black/80 dark:text-white/80 block mt-0.5 tracking-widest text-center">Qobuz</span>
        </span>
        <div className="w-8" />
      </div>`;
const newHeader = `        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
          REPRODUCIENDO DESDE<br/>
          <span className="text-black/80 dark:text-white/80 block mt-0.5 tracking-widest text-center">Qobuz</span>
        </span>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <ListMusic className="w-6 h-6 text-black dark:text-white" />
        </button>
      </div>`;
code = code.replace(oldHeader, newHeader);

// 5. Update Artwork with 3D Lyrics Flip
const oldArtwork = `      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10">
        <div className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-square rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 ease-out">
          <img
            src={currentTrack.image}
            alt={currentTrack.albumTitle}
            className={\`w-full h-full object-cover transition-transform duration-700 \${isPlaying ? 'scale-105' : 'scale-100'}\`}
          />
        </div>
      </div>`;
const newArtwork = `      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 w-full" style={{ perspective: '1000px' }}>
        <div 
          className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-square rounded-[2rem] shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer"
          style={{ transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          onClick={() => setShowLyrics(!showLyrics)}
        >
          {/* Front (Image) */}
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
            <img
              src={currentTrack.image}
              alt={currentTrack.albumTitle}
              className={\`w-full h-full object-cover transition-transform duration-700 \${isPlaying && !showLyrics ? 'scale-105' : 'scale-100'}\`}
            />
          </div>
          
          {/* Back (Lyrics) */}
          <div 
            className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-xl flex flex-col p-6 rounded-[2rem] overflow-hidden border border-white/10"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <h3 className="text-white font-bold text-xl mb-4 opacity-80 text-center">Letras</h3>
            <div className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none' }}>
              <p className="text-white/90 text-lg leading-relaxed font-medium mt-8">
                 🎶<br/><br/>
                 (Sincronización de letras no disponible para esta pista local)<br/><br/>
                 ...
              </p>
            </div>
          </div>
        </div>
      </div>`;
code = code.replace(oldArtwork, newArtwork);

// 6. Update Metadata badges and popover
const oldBadges = `          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className="px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded-md text-[10px] font-bold tracking-widest text-black/80 dark:text-white/80 border border-black/10 dark:border-white/10 uppercase">
              Lossless
            </span>
            <span className="text-[10px] font-medium tracking-wide text-black/40 dark:text-white/40 uppercase">
              FLAC • 16-Bit / 44.1 kHz
            </span>
          </div>`;
const newBadges = `          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className="px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded-md text-[10px] font-bold tracking-widest text-black/80 dark:text-white/80 border border-black/10 dark:border-white/10 uppercase hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              Lossless
            </button>
            <span className="text-[10px] font-medium tracking-wide text-black/40 dark:text-white/40 uppercase">
              FLAC • 16-Bit / 44.1 kHz
            </span>
            
            {showMetadata && (
              <div className="absolute bottom-full right-0 mb-4 p-4 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-black/5 dark:border-white/5 w-64 text-left z-50">
                 <h4 className="font-bold text-sm mb-3 text-black dark:text-white flex items-center gap-2">
                   <Info className="w-4 h-4" /> Calidad de Audio
                 </h4>
                 <div className="space-y-2 text-xs text-black/70 dark:text-white/70">
                   <p className="flex justify-between"><span>Formato:</span> <span className="font-mono font-medium">FLAC</span></p>
                   <p className="flex justify-between"><span>Frecuencia:</span> <span className="font-mono font-medium">44.1 kHz</span></p>
                   <p className="flex justify-between"><span>Profundidad:</span> <span className="font-mono font-medium">16-Bit</span></p>
                   <p className="flex justify-between"><span>Bitrate:</span> <span className="font-mono font-medium">1032 kbps</span></p>
                 </div>
              </div>
            )}
          </div>`;
code = code.replace(oldBadges, newBadges);

// 7. Play button color based on dominant color
const oldPlayButton = `bg-black dark:bg-white text-white dark:text-black`;
const newPlayButton = `bg-black dark:bg-white text-white dark:text-black`; 
// Actually, let's keep it black/white but if they want the control color to change...
// "el cambio de color de los controles y la animación dependiendo el color de la carátula"
const oldPlayFull = `className="w-20 h-20 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"`;
const newPlayFull = `className="w-20 h-20 flex items-center justify-center text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            style={{ backgroundColor: dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black'), color: dominantColor ? '#fff' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white') }}`;
code = code.replace(oldPlayFull, newPlayFull);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
