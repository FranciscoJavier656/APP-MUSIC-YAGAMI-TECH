const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Remove gemini import
code = code.replace(`import { chatWithGemini } from '../lib/gemini';\n`, '');

// 2. Add new refs and states
const oldState = `  const [lyrics, setLyrics] = useState<string>("Cargando letras...");`;
const newState = `  const [lyrics, setLyrics] = useState<string>("Cargando letras...");
  type LyricLine = { time: number; text: string };
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[] | null>(null);
  const parsedLyricsRef = useRef<LyricLine[] | null>(null);
  const activeLyricIndexRef = useRef<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);`;
code = code.replace(oldState, newState);

// 3. Update the useEffect for lyrics
const oldEffect = `  useEffect(() => {
    if (currentTrack && showLyrics) {
      setLyrics("Buscando letras...");
      chatWithGemini(\`Por favor, dame las letras de la canción "\${currentTrack.title}" de "\${currentTrack.artist}". Devuelve ÚNICAMENTE la letra de la canción, sin introducciones ni formato extra. Si no la encuentras, devuelve "Letras no encontradas."\`)
        .then(res => setLyrics(res || "Letras no encontradas."))
        .catch(() => setLyrics("Letras no disponibles."));
    }
  }, [currentTrack, showLyrics]);`;
  
const newEffect = `  useEffect(() => {
    if (currentTrack && showLyrics) {
      setLyrics("Buscando letras sincronizadas...");
      setParsedLyrics(null);
      parsedLyricsRef.current = null;
      activeLyricIndexRef.current = -1;
      
      const url = \`https://lrclib.net/api/search?track_name=\${encodeURIComponent(currentTrack.title)}&artist_name=\${encodeURIComponent(currentTrack.artist)}\`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const bestMatch = data[0];
            if (bestMatch.syncedLyrics) {
              const lines = bestMatch.syncedLyrics.split('\\n');
              const parsed: LyricLine[] = [];
              for (const line of lines) {
                const match = line.match(/\\[(\\d{2}):(\\d{2})\\.(\\d{2,3})\\](.*)/);
                if (match) {
                  const minutes = parseInt(match[1], 10);
                  const seconds = parseInt(match[2], 10);
                  const msStr = match[3].length === 2 ? match[3] + '0' : match[3];
                  const ms = parseInt(msStr, 10);
                  const time = minutes * 60 + seconds + ms / 1000;
                  const text = match[4].trim();
                  if (text) parsed.push({ time, text });
                }
              }
              setParsedLyrics(parsed);
              parsedLyricsRef.current = parsed;
              setLyrics("");
            } else if (bestMatch.plainLyrics) {
              setLyrics(bestMatch.plainLyrics);
            } else {
              setLyrics("Letras no encontradas.");
            }
          } else {
            setLyrics("Letras no encontradas.");
          }
        })
        .catch(() => setLyrics("Letras no disponibles."));
    }
  }, [currentTrack, showLyrics]);`;
code = code.replace(oldEffect, newEffect);

// 4. Update the render loop
const oldLoop = `        // 1. Update Progress UI
        if (audioRef.current) {
          const current = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;
          const dur = (audioRef.current as any).nativeDuration ?? (audioRef.current.duration || duration);
          
          if (dur > 0) {
            const percent = (current / dur) * 100;
            
            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = \`\${percent}%\`;
            }
            if (currentTimeRef.current && !isScrubbingRef.current) {
              currentTimeRef.current.textContent = formatTime(current);
            }
            if (remainingTimeRef.current) {
              remainingTimeRef.current.textContent = "-" + formatTime(dur - current);
            }
          }
        }`;
const newLoop = `        // 1. Update Progress UI
        if (audioRef.current) {
          const current = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;
          const dur = (audioRef.current as any).nativeDuration ?? (audioRef.current.duration || duration);
          
          if (dur > 0) {
            const percent = (current / dur) * 100;
            
            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = \`\${percent}%\`;
            }
            if (currentTimeRef.current && !isScrubbingRef.current) {
              currentTimeRef.current.textContent = formatTime(current);
            }
            if (remainingTimeRef.current) {
              remainingTimeRef.current.textContent = "-" + formatTime(dur - current);
            }
          }
          
          // 1.5 Update Synced Lyrics
          if (parsedLyricsRef.current && lyricsContainerRef.current) {
            const lyricsArray = parsedLyricsRef.current;
            let activeIdx = -1;
            for (let i = 0; i < lyricsArray.length; i++) {
                if (current >= lyricsArray[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }
            
            if (activeIdx !== activeLyricIndexRef.current) {
                activeLyricIndexRef.current = activeIdx;
                const container = lyricsContainerRef.current;
                const children = container.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i] as HTMLElement;
                    if (i === activeIdx) {
                        child.style.opacity = '1';
                        child.style.transform = 'scale(1.05)';
                        child.style.color = '#fff';
                        child.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        child.style.opacity = '0.4';
                        child.style.transform = 'scale(1)';
                        child.style.color = 'rgba(255,255,255,0.7)';
                    }
                }
            }
          }
        }`;
code = code.replace(oldLoop, newLoop);

// 5. Render Lyrics in DOM
const oldLyricsRender = `            <div className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none' }}>
              <div className="text-white/90 text-lg leading-relaxed font-medium mt-4 whitespace-pre-wrap pb-12">
                {lyrics}
              </div>
            </div>`;
const newLyricsRender = `            <div className="overflow-y-auto flex-1 text-center mask-image-fade" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
              <div className="flex flex-col items-center justify-center min-h-full py-20 px-2" ref={lyricsContainerRef}>
                {parsedLyrics ? (
                  parsedLyrics.map((line, idx) => (
                    <p 
                      key={idx} 
                      className="text-white/70 text-xl md:text-2xl font-bold mb-6 transition-all duration-300 ease-out origin-center"
                      style={{ opacity: 0.4, transform: 'scale(1)' }}
                    >
                      {line.text}
                    </p>
                  ))
                ) : (
                  <div className="text-white/90 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                    {lyrics}
                  </div>
                )}
              </div>
            </div>`;
code = code.replace(oldLyricsRender, newLyricsRender);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
