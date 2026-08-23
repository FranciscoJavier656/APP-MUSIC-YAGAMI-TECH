import { usePlayer } from './PlayerContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Play, Pause, Loader2, SkipBack, SkipForward, Repeat, Shuffle, Volume2, ListMusic, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const Visualizer = ({ analyser, isPlaying }: { analyser: AnalyserNode | null, isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      if (!isPlaying) {
        // Draw resting line
        ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
        ctx.fillRect(0, height / 2 - 1, width, 2);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 255 * height;

        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.fillStyle = isDarkMode ? `rgba(255, 255, 255, ${dataArray[i]/255 * 0.5})` : `rgba(0, 0, 0, ${dataArray[i]/255 * 0.5})`;
        
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth - 1, barHeight, 4);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isPlaying]);

  return <canvas ref={canvasRef} width={200} height={40} className="w-full h-10 opacity-70" />;
};

export default function ExpandedPlayer() {
  const { 
    currentTrack, isPlaying, isLoading, togglePlay, progress, currentTime, duration, 
    setIsExpanded, seekTo, volume, setVolume,
    queue, nextTrack, prevTrack, isShuffle, toggleShuffle, repeatMode, toggleRepeat, playTrack,
    analyser
  } = usePlayer();
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrack?.image) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = currentTrack.image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setDominantColor(`rgb(${r}, ${g}, ${b})`);
        }
      };
      img.onerror = () => setDominantColor(null);
    } else {
      setDominantColor(null);
    }
  }, [currentTrack?.image]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo((val / 100) * duration);
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md flex flex-col pt-12 pb-8 px-6 sm:px-12"
    >
      {/* Animated Breathing Background */}
      <motion.div 
        className="absolute inset-0 z-[-1] opacity-50 dark:opacity-40 pointer-events-none"
        animate={{
          scale: [1.1, 1.3, 1.1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundImage: `url(${currentTrack.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(120px) saturate(250%)'
        }}
      />
      
      {/* Dark overlay to ensure contrast */}
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-transparent to-black/20 dark:to-black/50 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => setIsExpanded(false)} 
          className="p-2 -ml-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-black/50 dark:text-white/50 uppercase">
            REPRODUCIENDO DESDE
          </span>
          <span className="text-xs font-semibold text-black/80 dark:text-white/80 mt-0.5">
            {currentTrack.hires ? 'Qobuz Hi-Res' : 'Qobuz'}
          </span>
        </div>
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => setShowQueue(true)} 
          className="p-2 -mr-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
        >
          <ListMusic className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Album Art */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center mb-6 mt-2 relative">
        <motion.div 
          className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          style={{ width: 'min(100%, 45vh)', height: 'min(100%, 45vh)' }}
          animate={{ scale: isPlaying ? 1 : 0.9, y: isPlaying ? 0 : 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          {currentTrack.image ? (
            <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="w-full h-full bg-gray-200/50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400">?</div>
          )}
        </motion.div>
      </div>

      {/* Visualizer & Info */}
      <div className="mb-6">
        <div className="mb-2">
          <Visualizer analyser={analyser} isPlaying={isPlaying} />
        </div>
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-[26px] font-bold leading-tight truncate text-black dark:text-white drop-shadow-sm">{currentTrack.title}</h2>
            <p className="text-[18px] text-black/70 dark:text-white/70 truncate mt-1 font-medium">{currentTrack.artist}</p>
          </div>
          
          <button 
            onClick={() => setShowCredits(true)}
            className="flex flex-col items-end gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95 origin-right cursor-pointer"
          >
            {currentTrack.hires ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 backdrop-blur-md rounded border border-yellow-500/30 shadow-sm">
                <span className="text-[10px] font-black tracking-wider text-yellow-600 dark:text-yellow-500">HI-RES AUDIO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/20 backdrop-blur-md rounded border border-gray-500/30 shadow-sm">
                <span className="text-[10px] font-black tracking-wider text-gray-600 dark:text-gray-400">LOSSLESS</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-widest text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
                FLAC
              </span>
              {(currentTrack.bitDepth || currentTrack.samplingRate) && (
                <span className="text-[9px] font-bold tracking-widest text-black/40 dark:text-white/40">
                  {currentTrack.bitDepth || 16}-BIT / {currentTrack.samplingRate || 44.1} kHz
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Scrubber */}
      <div className="mb-8">
        <div 
          className="relative w-full flex items-center group cursor-pointer"
          style={{ height: isScrubbing ? '16px' : '8px' }}
        >
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={progress || 0}
            onChange={handleSeek}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer touch-none"
          />
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden transition-all duration-200"
               style={{ height: isScrubbing ? '8px' : '4px' }}>
            <div 
              className="h-full transition-all duration-75 relative"
              style={{ width: `${progress}%`, backgroundColor: dominantColor || 'currentColor' }}
            >
              {/* Thumb */}
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-opacity duration-200 ${isScrubbing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[12px] font-semibold text-black/50 dark:text-white/50 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2 sm:px-8 mb-8">
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={toggleShuffle}
          className={`transition-colors p-2 ${isShuffle ? '' : 'text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80'}`}
          style={isShuffle ? { color: dominantColor || 'currentColor' } : undefined}
        >
          <Shuffle className="w-6 h-6" />
        </motion.button>
        
        <motion.button whileTap={{ scale: 0.85 }} onClick={prevTrack} className="text-black dark:text-white hover:opacity-70 transition-opacity p-2">
          <SkipBack className="w-10 h-10 fill-current" />
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay} 
          className="w-20 h-20 flex items-center justify-center text-white dark:text-black rounded-full shadow-xl hover:scale-105 transition-transform"
          style={{ backgroundColor: dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black') }}
        >
          {isLoading ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-10 h-10 fill-current" />
          ) : (
            <Play className="w-10 h-10 fill-current ml-1" />
          )}
        </motion.button>

        <motion.button whileTap={{ scale: 0.85 }} onClick={nextTrack} className="text-black dark:text-white hover:opacity-70 transition-opacity p-2">
          <SkipForward className="w-10 h-10 fill-current" />
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={toggleRepeat}
          className={`transition-colors p-2 relative ${repeatMode !== 'off' ? '' : 'text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80'}`}
          style={repeatMode !== 'off' ? { color: dominantColor || 'currentColor' } : undefined}
        >
          <Repeat className="w-6 h-6" />
          {repeatMode === 'one' && (
            <span 
              className="absolute top-1 right-1 text-white dark:text-black text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full"
              style={{ backgroundColor: dominantColor || 'currentColor' }}
            >1</span>
          )}
        </motion.button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-4 px-4 mt-auto mb-2">
        <Volume2 className="w-4 h-4 text-black/40 dark:text-white/40" />
        <div className="relative h-4 flex-1 flex items-center group cursor-pointer">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer touch-none"
          />
          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden transition-all duration-200 group-hover:h-2">
            <div 
              className="h-full transition-all duration-75"
              style={{ width: `${volume * 100}%`, backgroundColor: dominantColor || 'currentColor' }}
            />
          </div>
        </div>
      </div>

      {/* Queue Modal */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md flex flex-col"
          >
            <div className="p-6 pt-12 flex justify-between items-center border-b border-black/5 dark:border-white/5 bg-transparent sticky top-0 z-10">
              <h3 className="font-bold text-2xl text-black dark:text-white">A Continuación</h3>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => setShowQueue(false)} 
                className="p-2 -mr-2 bg-black/5 dark:bg-white/10 rounded-full text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {queue.map((track, idx) => (
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  key={`${track.id}-${idx}`}
                  onClick={() => { playTrack(track); setShowQueue(false); }}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${
                    currentTrack.id === track.id ? 'bg-black/5 dark:bg-white/10 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <img src={track.image} alt={track.title} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[15px] truncate ${currentTrack.id === track.id ? 'text-black dark:text-white' : 'text-black/80 dark:text-white/80'}`}>
                      {track.title}
                    </p>
                    <p className="text-[13px] text-black/50 dark:text-white/50 truncate mt-0.5 font-medium">
                      {track.artist}
                    </p>
                  </div>
                  {currentTrack.id === track.id && (
                    <div className="w-4 flex items-end justify-between h-4 pr-1">
                      <div className="w-[3px] bg-black dark:bg-white animate-[bounce_1s_infinite] h-full" />
                      <div className="w-[3px] bg-black dark:bg-white animate-[bounce_1s_infinite_0.2s] h-3/4" />
                      <div className="w-[3px] bg-black dark:bg-white animate-[bounce_1s_infinite_0.4s] h-1/2" />
                    </div>
                  )}
                </motion.div>
              ))}
              {queue.length === 0 && (
                <div className="h-full flex items-center justify-center text-black/40 dark:text-white/40 font-medium">
                  La cola está vacía
                </div>
              )}
            </div>
          </motion.div>
        )}
        {showCredits && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md flex flex-col"
          >
            <div className="p-6 pt-12 flex justify-between items-center border-b border-black/5 dark:border-white/5 bg-transparent sticky top-0 z-10">
              <h3 className="font-bold text-2xl text-black dark:text-white">Créditos de la pista</h3>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => setShowCredits(false)} 
                className="p-2 -mr-2 bg-black/5 dark:bg-white/10 rounded-full text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-black/50 dark:text-white/50 uppercase mb-1">Pista</h4>
                <p className="text-[17px] font-semibold text-black dark:text-white">{currentTrack.title}</p>
                <p className="text-[15px] text-black/70 dark:text-white/70">{currentTrack.artist}</p>
              </div>

              {currentTrack.albumTitle && (
                <div>
                  <h4 className="text-[11px] font-bold tracking-widest text-black/50 dark:text-white/50 uppercase mb-1">Álbum</h4>
                  <p className="text-[15px] font-medium text-black dark:text-white">{currentTrack.albumTitle}</p>
                </div>
              )}

              {currentTrack.composer && (
                <div>
                  <h4 className="text-[11px] font-bold tracking-widest text-black/50 dark:text-white/50 uppercase mb-1">Compositor</h4>
                  <p className="text-[15px] font-medium text-black dark:text-white">{currentTrack.composer}</p>
                </div>
              )}

              {currentTrack.label && (
                <div>
                  <h4 className="text-[11px] font-bold tracking-widest text-black/50 dark:text-white/50 uppercase mb-1">Sello Discográfico (Label)</h4>
                  <p className="text-[15px] font-medium text-black dark:text-white">{currentTrack.label}</p>
                </div>
              )}

              {currentTrack.releaseDate && (
                <div>
                  <h4 className="text-[11px] font-bold tracking-widest text-black/50 dark:text-white/50 uppercase mb-1">Lanzamiento</h4>
                  <p className="text-[15px] font-medium text-black dark:text-white">{new Date(currentTrack.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}

              {currentTrack.copyright && (
                <div>
                  <h4 className="text-[11px] font-bold tracking-widest text-black/50 dark:text-white/50 uppercase mb-1">Copyright</h4>
                  <p className="text-[13px] text-black/70 dark:text-white/70">{currentTrack.copyright}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
