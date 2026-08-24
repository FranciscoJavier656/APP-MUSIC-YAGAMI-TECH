import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';

export default function ExpandedPlayer() {
  const { 
    currentTrack, isPlaying, togglePlay, 
    duration, isExpanded, setIsExpanded,
    seekTo, nextTrack, prevTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
    audioRef
  } = usePlayer();

  const [isScrubbing, _setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    _setIsScrubbing(val);
  };

  const progressRef = useRef<HTMLDivElement>(null);
  const seekInputRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  // Sync FFT data
  useEffect(() => {
    let listener: any;
    const setup = async () => {
      listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current && info.data) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
      });
    };
    setup();
    return () => { if (listener) listener.remove(); };
  }, []);

  // Main rendering loop for Progress and FFT
  useEffect(() => {
    let animationId: number;
    let timeoutId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
        
    const startDrawing = () => {
      const draw = () => {
        // 1. Update Progress UI
        if (audioRef.current) {
          const current = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;
          const dur = (audioRef.current as any).nativeDuration ?? (audioRef.current.duration || duration);
          
          if (dur > 0) {
            const percent = (current / dur) * 100;
            
            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = `${percent}%`;
            }
            if (currentTimeRef.current && !isScrubbingRef.current) {
              currentTimeRef.current.textContent = formatTime(current);
            }
            if (remainingTimeRef.current) {
              remainingTimeRef.current.textContent = "-" + formatTime(dur - current);
            }
          }
        }

        // 2. Draw Analyser (Native iOS vDSP)
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const dataArray = (canvas as any).nativeFftData;
          const bufferLength = dataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Slight padding between bars
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const baseRgb = isDarkMode ? '255, 255, 255' : '0, 0, 0';
          
          for (let i = 0; i < bufferLength; i++) {
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + dataArray[i] * 0.30;
            
            let barHeight = (smoothed[i] / 255) * canvas.height;
            if (barHeight < 3) barHeight = 3; // Minimum height for silence
            
            ctx.fillStyle = `rgba(${baseRgb}, ${0.15 + (smoothed[i]/255)*0.85})`; 
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
            } else {
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            }
            ctx.fill();
            x += barWidth;
          }
        }

        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    if (isExpanded) {
      timeoutId = window.setTimeout(startDrawing, 100);
    }
    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [audioRef, isExpanded, duration]);

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

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? duration;
    const current = (val / 100) * dur;
    if (progressRef.current) progressRef.current.style.width = `${val}%`;
    if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
  };

  const handleSeekCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? duration;
    seekTo((val / 100) * dur);
    // Add small delay to let native catch up before we resume automatic updates
    setTimeout(() => setIsScrubbing(false), 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col pt-12 pb-8 px-6 sm:px-12 transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {dominantColor && (
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle at 50% 0%, ${dominantColor} 0%, transparent 70%)` 
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-8 h-8 text-black dark:text-white" />
        </button>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
          REPRODUCIENDO DESDE<br/>
          <span className="text-black/80 dark:text-white/80 block mt-0.5 tracking-widest text-center">Qobuz</span>
        </span>
        <div className="w-8" />
      </div>

      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10">
        <div className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-square rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 ease-out">
          <img
            src={currentTrack.image}
            alt={currentTrack.albumTitle}
            className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
          />
        </div>
      </div>

      {/* Audio Visualizer Canvas */}
      <div className="h-16 w-full max-w-[320px] sm:max-w-[400px] mx-auto mt-4 mb-2 flex items-end">
         <canvas 
            ref={canvasRef} 
            width={300} 
            height={60} 
            className="w-full h-full"
         />
      </div>

      {/* Track Info & Controls */}
      <div className="mt-2 mb-8 relative z-10">
        <div className="flex justify-between items-end mb-6">
          <div className="overflow-hidden pr-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight">{currentTrack.title}</h2>
            <p className="text-lg text-black/60 dark:text-white/60 truncate mt-1">{currentTrack.artist}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className="px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded-md text-[10px] font-bold tracking-widest text-black/80 dark:text-white/80 border border-black/10 dark:border-white/10 uppercase">
              Lossless
            </span>
            <span className="text-[10px] font-medium tracking-wide text-black/40 dark:text-white/40 uppercase">
              FLAC • 16-Bit / 44.1 kHz
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 relative group">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="absolute top-1/2 -translate-y-1/2 w-full h-8 z-10 opacity-0 cursor-pointer"
          />
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden pointer-events-none">
            <div
              ref={progressRef}
              className="h-full relative transition-all duration-100"
              style={{ width: '0%', backgroundColor: dominantColor || 'rgba(120, 120, 120, 0.8)' }}
            >
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[12px] font-semibold text-black/50 dark:text-white/50 tabular-nums tracking-wide">
            <span ref={currentTimeRef}>0:00</span>
            <span ref={remainingTimeRef}>-0:00</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between px-2 sm:px-8 mb-4">
          <button
            onClick={toggleShuffle}
            className={`transition-colors p-2 ${isShuffle ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30 hover:text-black/80 dark:hover:text-white/80'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button 
            onClick={prevTrack}
            className="p-3 text-black dark:text-white hover:opacity-70 transition-opacity"
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </button>
          <button
            onClick={togglePlay}
            className="w-20 h-20 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-1" />
            )}
          </button>
          <button 
            onClick={nextTrack}
            className="p-3 text-black dark:text-white hover:opacity-70 transition-opacity"
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`transition-colors p-2 relative ${repeatMode !== 'off' ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30 hover:text-black/80 dark:hover:text-white/80'}`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold">1</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
