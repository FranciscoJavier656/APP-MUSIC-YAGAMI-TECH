import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, ListMusic, Info, MoreHorizontal, Download } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';
import { Capacitor } from '@capacitor/core';
import { getImageSrc } from '../lib/image';


export default function ExpandedPlayer() {
  const { 
    currentTrack, isPlaying, togglePlay, 
    duration, isExpanded, setIsExpanded,
    seekTo, nextTrack, prevTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
    audioRef, queue, setContextMenuTrack, setDownloadItem
  } = usePlayer();

  const [isScrubbing, _setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    _setIsScrubbing(val);
  };

  const progressRef = useRef<HTMLDivElement>(null);
  const seekInputRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantColor, _setDominantColor] = useState<string | null>(null);
  const dominantColorRef = useRef<string | null>(null);
  const setDominantColor = (color: string | null) => {
    dominantColorRef.current = color;
    _setDominantColor(color);
  };
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [lyrics, setLyrics] = useState<string>("Cargando letras...");
  type LyricLine = { time: number; text: string };
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[] | null>(null);
  const parsedLyricsRef = useRef<LyricLine[] | null>(null);
  const activeLyricIndexRef = useRef<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  // Swipe gesture state
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
  };

  // Sync FFT data
  useEffect(() => {
    let listener: any;
    const setup = async () => {
      if (Capacitor.isNativePlatform()) {
        listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current && info.data) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
      });
      }
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
            if (seekInputRef.current && !isScrubbingRef.current) {
              seekInputRef.current.value = percent.toString();
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
        }

        // 2. Draw Analyser (Native iOS vDSP)
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          const bufferLength = rawDataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Slight padding between bars
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          let r = isDarkMode ? 255 : 0;
          let g = isDarkMode ? 255 : 0;
          let b = isDarkMode ? 255 : 0;
          
          if (dominantColorRef.current) {
            const match = dominantColorRef.current.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
              r = parseInt(match[1]);
              g = parseInt(match[2]);
              b = parseInt(match[3]);
            }
          }
          const baseRgb = `${r}, ${g}, ${b}`;
          
          for (let i = 0; i < bufferLength; i++) {
            // If paused, force the target value to 0 so it decays smoothly
            const targetValue = isPlayingRef.current ? rawDataArray[i] : 0;
            
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;
            
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
      img.src = getImageSrc(currentTrack.image) || '';
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

  useEffect(() => {
    if (currentTrack && showLyrics) {
      setLyrics("Buscando letras sincronizadas...");
      setParsedLyrics(null);
      parsedLyricsRef.current = null;
      activeLyricIndexRef.current = -1;
      
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(currentTrack.title)}&artist_name=${encodeURIComponent(currentTrack.artist)}`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const bestMatch = data[0];
            if (bestMatch.syncedLyrics) {
              const lines = bestMatch.syncedLyrics.split('\n');
              const parsed: LyricLine[] = [];
              for (const line of lines) {
                const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
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
  }, [currentTrack, showLyrics]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: any) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? duration;
    const current = (val / 100) * dur;
    if (progressRef.current) progressRef.current.style.width = `${val}%`;
    if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
  };

  const handleSeekCommit = (e: any) => {
    let val = parseFloat(e.target?.value);
    if (isNaN(val) && seekInputRef.current) {
        val = parseFloat(seekInputRef.current.value);
    }
    const dur = (audioRef.current as any)?.nativeDuration ?? (audioRef.current?.duration || duration);
    seekTo((val / 100) * dur);
    // Add small delay to let native catch up before we resume automatic updates
    setTimeout(() => setIsScrubbing(false), 200);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col pt-12 pb-8 px-6 sm:px-12 transform ${touchOffsetY === 0 ? 'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]' : ''}`}
      style={{ transform: isExpanded ? (touchOffsetY > 0 ? `translateY(${touchOffsetY}px)` : 'translateY(0px)') : 'translateY(100%)' }}
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
        <div className="flex items-center gap-1 -mr-2">
          <button onClick={() => setContextMenuTrack(currentTrack)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <MoreHorizontal className="w-6 h-6 text-black dark:text-white" />
          </button>
          <button onClick={() => setShowQueue(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ListMusic className="w-6 h-6 text-black dark:text-white" />
          </button>
        </div>
      </div>

      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 w-full" style={{ perspective: '2000px' }}>
        <div 
          className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"
          style={{ 
            width: 'min(100%, 45vh, 380px)',
            height: 'min(100%, 45vh, 380px)',
            transformStyle: 'preserve-3d', 
            transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' 
          }}
          onClick={() => setShowLyrics(!showLyrics)}
        >
          {/* Front (Image) */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner" style={{ backfaceVisibility: 'hidden' }}>
            <img
              src={getImageSrc(currentTrack.image)}
              alt={currentTrack.albumTitle}
              className={`w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] ${isPlaying && !showLyrics ? 'scale-105' : 'scale-100'}`}
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
              style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px)' }}
            />
            
            <div className="absolute inset-0 flex flex-col p-6 bg-black/40">
                <div className="flex justify-center mb-2 relative z-20">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/90 tracking-widest uppercase shadow-sm">
                    Letras
                  </span>
                </div>
                <div onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
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
          
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setDownloadItem({item: currentTrack, type: 'track'}); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setContextMenuTrack(currentTrack); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
            
          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">
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
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute top-1/2 -translate-y-1/2 w-full h-8 z-10 opacity-0 cursor-pointer touch-none"
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
            className="w-20 h-20 flex items-center justify-center text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            style={{ backgroundColor: dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black'), color: dominantColor ? '#fff' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white') }}
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
      {/* Queue Modal */}
      <div 
        className={`absolute inset-0 z-50 bg-white dark:bg-[#121212] p-6 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showQueue ? 'translate-y-0' : 'translate-y-full'}`}
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
              style={{ background: `radial-gradient(circle at 100% 0%, ${dominantColor} 0%, transparent 60%)` }}
            />
          )}
          <div onTouchMove={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto pb-20 space-y-4">
            {queue.map((track, idx) => {
              const isPlayingQueue = currentTrack?.id === track.id;
              return (
                <div key={idx} className={`flex items-center gap-4 p-3 rounded-2xl ${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}`}>
                  <img src={getImageSrc(track.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isPlayingQueue ? 'text-black dark:text-white' : 'text-black/80 dark:text-white/80'}`}>
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
    </div>
  );
}
