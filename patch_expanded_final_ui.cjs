const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Touch Swipe Fix
const oldSwipeState = `  // Swipe gesture state
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
  
const newSwipeState = `  // Swipe gesture state
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchOffsetY, setTouchOffsetY] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchOffsetY(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setTouchOffsetY(diff);
    }
  };
  const handleTouchEnd = () => {
    if (touchOffsetY > 120) {
      setIsExpanded(false);
    }
    setTouchOffsetY(0);
    setTouchStartY(0);
  };`;
code = code.replace(oldSwipeState, newSwipeState);

const oldContainerTransform = `className={\`fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col pt-12 pb-8 px-6 sm:px-12 transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] \${isExpanded ? 'translate-y-0' : 'translate-y-full'}\`}`;
const newContainerTransform = `className={\`fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col pt-12 pb-8 px-6 sm:px-12 transform \${touchOffsetY === 0 ? 'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}\`}
      style={{ transform: \`translateY(\${isExpanded ? touchOffsetY : '100%'}px)\` }}`;
code = code.replace(oldContainerTransform, newContainerTransform);

// 2. Fix progress input sync
const oldSync = `            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = \`\${percent}%\`;
            }
            if (currentTimeRef.current && !isScrubbingRef.current) {
              currentTimeRef.current.textContent = formatTime(current);
            }`;
const newSync = `            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = \`\${percent}%\`;
            }
            if (seekInputRef.current && !isScrubbingRef.current) {
              seekInputRef.current.value = percent.toString();
            }
            if (currentTimeRef.current && !isScrubbingRef.current) {
              currentTimeRef.current.textContent = formatTime(current);
            }`;
code = code.replace(oldSync, newSync);

// 3. Polish Card Flip & Lyrics Design
const oldArtwork = `      {/* Artwork */}
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
            <div className="overflow-y-auto flex-1 text-center mask-image-fade" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
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
            </div>
          </div>
        </div>
      </div>`;
      
const newArtwork = `      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 w-full" style={{ perspective: '2000px' }}>
        <div 
          className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"
          style={{ transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' }}
          onClick={() => setShowLyrics(!showLyrics)}
        >
          {/* Front (Image) */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner" style={{ backfaceVisibility: 'hidden' }}>
            <img
              src={currentTrack.image}
              alt={currentTrack.albumTitle}
              className={\`w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] \${isPlaying && !showLyrics ? 'scale-105' : 'scale-100'}\`}
            />
          </div>
          
          {/* Back (Lyrics) */}
          <div 
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-gray-900"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {/* Blurred background using album art */}
            <div 
              className="absolute inset-0 opacity-40 scale-110" 
              style={{ backgroundImage: \`url(\${currentTrack.image})\`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px)' }}
            />
            
            <div className="absolute inset-0 flex flex-col p-6 bg-black/40">
                <div className="flex justify-center mb-2 relative z-20">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/90 tracking-widest uppercase shadow-sm">
                    Letras
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                  <div className="flex flex-col items-center justify-center min-h-full py-20 px-4" ref={lyricsContainerRef}>
                    {parsedLyrics ? (
                      parsedLyrics.map((line, idx) => (
                        <p 
                          key={idx} 
                          className="text-white/60 text-[1.35rem] leading-[1.4] font-bold mb-7 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-center"
                          style={{ opacity: 0.3, transform: 'scale(0.95)' }}
                        >
                          {line.text}
                        </p>
                      ))
                    ) : (
                      <div className="text-white/80 text-xl leading-relaxed font-semibold whitespace-pre-wrap">
                        {lyrics}
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>`;
code = code.replace(oldArtwork, newArtwork);

// 4. Queue Modal Animation Polish
const oldQueue = `      {/* Queue Modal */}
      {showQueue && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom-8">
          <div className="flex items-center justify-between mb-6 pt-6">
            <h3 className="text-2xl font-bold text-black dark:text-white">A continuación</h3>
            <button onClick={() => setShowQueue(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>`;
          
const newQueue = `      {/* Queue Modal */}
      <div 
        className={\`absolute inset-0 z-50 bg-white dark:bg-[#121212] p-6 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] \${showQueue ? 'translate-y-0' : 'translate-y-full'}\`}
      >
          <div className="flex items-center justify-between mb-6 pt-6 relative z-10">
            <h3 className="text-2xl font-bold text-black dark:text-white tracking-tight">A continuación</h3>
            <button onClick={() => setShowQueue(false)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
          {dominantColor && (
            <div 
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] mix-blend-screen dark:mix-blend-lighten pointer-events-none"
              style={{ background: \`radial-gradient(circle at 100% 0%, \${dominantColor} 0%, transparent 60%)\` }}
            />
          )}`;
code = code.replace(oldQueue, newQueue);

const oldQueueEnd = `        </div>
      )}
    </div>`;
const newQueueEnd = `        </div>
      </div>
    </div>`;
code = code.replace(oldQueueEnd, newQueueEnd);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
