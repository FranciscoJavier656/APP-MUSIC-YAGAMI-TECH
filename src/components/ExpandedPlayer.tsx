import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MoreHorizontal, ArrowDown, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-react';
import { usePlayer } from './PlayerContext';

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const mins = Math.floor(Math.max(0, time) / 60);
  const secs = Math.floor(Math.max(0, time) % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ExpandedPlayer() {
  const { currentTrack, isExpanded, setIsExpanded, isPlaying, togglePlay, duration, audioRef, seekTo, nextTrack, prevTrack } = usePlayer();

  const [dominantColor, setDominantColor] = useState({ r: 80, g: 80, b: 80 });
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fftDataRef = useRef<number[]>(new Array(64).fill(0));
  const smoothedDataRef = useRef<number[]>(new Array(64).fill(0));
  const animationRef = useRef<number>();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExpanded) {
      interval = setInterval(() => {
        if (!isDragging && audioRef.current) {
           setCurrentTime((audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime);
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isExpanded, isDragging, audioRef]);

  // Extraer color vibrante
  useEffect(() => {
    if (!currentTrack?.image) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = currentTrack.image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      
      let maxScore = 0;
      let bestColor = { r: 80, g: 80, b: 80 };
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luma > 30 && luma < 220) {
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat * luma > maxScore) { maxScore = sat * luma; bestColor = { r, g, b }; }
        }
      }
      setDominantColor(bestColor);
    };
  }, [currentTrack]);

  // Animación del Canvas y el Aura
  useEffect(() => {
    if (!isExpanded) return;

    const handleFft = (e: any) => { if (e.detail?.data) fftDataRef.current = e.detail.data; };
    window.addEventListener('fft_data', handleFft);

    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
      canvasRef.current.width = canvasRef.current.offsetWidth * window.devicePixelRatio;
      canvasRef.current.height = 60 * window.devicePixelRatio;
      if (ctxRef.current) ctxRef.current.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    const draw = () => {
      if (!canvasRef.current || !ctxRef.current) return;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let bassSum = 0, midSum = 0;
      const barCount = 64, spacing = 3;
      const barWidth = (canvas.offsetWidth - (spacing * (barCount - 1))) / barCount;

      for (let i = 0; i < barCount; i++) {
        const targetValue = (fftDataRef.current[i] || 0) / 255;
        // Suavizado físico
        smoothedDataRef.current[i] = smoothedDataRef.current[i] * 0.70 + targetValue * 0.30;
        const val = smoothedDataRef.current[i];

        if (i < 10) bassSum += val;
        else if (i >= 10 && i < 30) midSum += val;

        const height = Math.max(4, val * 60);
        const x = i * (barWidth + spacing);
        // ¡Magia! Crece desde abajo
        const y = 60 - height;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barWidth, height, [2, 2, 0, 0]);
        else ctx.fillRect(x, y, barWidth, height);
        ctx.fillStyle = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${0.3 + val * 0.7})`;
        ctx.fill();
      }

      // Aura (DOM directo)
      const bassImpact = bassSum / 10, midImpact = midSum / 20;
      if (bgGlowRef.current) {
        bgGlowRef.current.style.transform = `scale(${1 + bassImpact * 0.3})`;
        bgGlowRef.current.style.opacity = `${0.2 + bassImpact * 0.4}`;
      }
      if (playBtnRef.current) {
         playBtnRef.current.style.boxShadow = `0 ${10 + midImpact * 15}px ${20 + midImpact * 20}px -5px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${0.4 + midImpact * 0.4})`;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('fft_data', handleFft);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isExpanded, dominantColor]);

  if (!currentTrack || !isExpanded) return null;
  const rgb = `${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}`;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden"
      >
        {/* El Aura Radial */}
        <div ref={bgGlowRef} className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-full pointer-events-none transition-transform duration-75 ease-out"
          style={{ background: `radial-gradient(circle at center, rgba(${rgb}, 0.5) 0%, rgba(0,0,0,0) 60%)`, mixBlendMode: 'screen' }} />

        {/* Header */}
        <div className="flex items-center justify-between p-6 relative z-10">
          <button onClick={() => setIsExpanded(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95"><ChevronDown size={28} /></button>
          <div className="flex flex-col items-center"><span className="text-[10px] font-bold tracking-widest text-white/60">REPRODUCIENDO</span><span className="text-[13px] font-semibold">LIBRERÍA</span></div>
          <button className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95"><MoreHorizontal size={24} /></button>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-[500px] w-full mx-auto pb-8">
          
          {/* Carátula y Letras (3D) */}
          <div className="px-8 w-full aspect-square relative perspective-1000 cursor-pointer group" onClick={() => setShowLyrics(!showLyrics)}>
            <motion.div animate={{ rotateY: showLyrics ? 180 : 0 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }} className="w-full h-full relative preserve-3d">
              {/* Cover */}
              <div className="absolute inset-0 backface-hidden shadow-2xl rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <img src={currentTrack.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
              </div>
              {/* Lyrics */}
              <div className="absolute inset-0 backface-hidden rounded-xl bg-black/80 backdrop-blur-3xl border border-white/10 flex items-center justify-center p-6 text-center" style={{ transform: 'rotateY(180deg)' }}>
                <p className="text-2xl font-bold text-white scale-110">Letras Sincronizadas<br/><span className="text-sm text-white/50">(Aquí va el motor LRC)</span></p>
              </div>
            </motion.div>
          </div>

          {/* FFT Visualizer */}
          <div className="w-full h-[60px] px-8 mt-6"><canvas ref={canvasRef} className="w-full h-full block" /></div>

          {/* Track Info */}
          <div className="px-8 mt-6 flex justify-between items-center">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-lg text-white/60 truncate">{currentTrack.artist}</p>
                <span className="text-[9px] font-bold tracking-widest text-white/80 px-1.5 py-0.5 bg-white/10 border border-white/10 rounded">LOSSLESS</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 mt-8">
            <div className="h-1.5 bg-white/10 rounded-full relative cursor-pointer group"
              onPointerDown={(e) => { setIsDragging(true); const r = e.currentTarget.getBoundingClientRect(); setCurrentTime(duration * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
              onPointerMove={(e) => { if (isDragging) { const r = e.currentTarget.getBoundingClientRect(); setCurrentTime(duration * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); } }}
              onPointerUp={(e) => { setIsDragging(false); const r = e.currentTarget.getBoundingClientRect(); seekTo(duration * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
            >
              <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${(currentTime / (duration || 1)) * 100}%`, backgroundColor: `rgb(${rgb})` }} />
              <div className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity pointer-events-none" style={{ left: `${(currentTime / (duration || 1)) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium font-mono text-white/50"><span>{formatTime(currentTime)}</span><span>-{formatTime(duration - currentTime)}</span></div>
          </div>

          {/* Controls */}
          <div className="px-8 mt-6 flex items-center justify-between">
            <button className="p-2 text-white/30 hover:text-white/60 transition-colors"><Shuffle size={24} /></button>
            <button onClick={prevTrack} className="p-2 text-white hover:text-white/80 active:scale-90 transition-all"><SkipBack size={36} fill="currentColor" /></button>
            
            <button ref={playBtnRef} onClick={togglePlay} className="w-20 h-20 rounded-full flex items-center justify-center text-white active:scale-95 transition-all" style={{ backgroundColor: `rgb(${rgb})` }}>
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            
            <button onClick={nextTrack} className="p-2 text-white hover:text-white/80 active:scale-90 transition-all"><SkipForward size={36} fill="currentColor" /></button>
            <button className="p-2 text-white/30 hover:text-white/60 transition-colors"><Repeat size={24} /></button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
