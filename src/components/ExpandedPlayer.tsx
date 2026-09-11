import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MoreHorizontal, ArrowDown, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-react';
import { usePlayer } from './PlayerContext';

// --- Funciones Auxiliares ---
const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const mins = Math.floor(Math.max(0, time) / 60);
  const secs = Math.floor(Math.max(0, time) % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Parseador de LRC (Karaoke)
const parseLrc = (lrcString: string) => {
  const lines = lrcString.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      if (text) parsed.push({ time, text });
    }
  }
  return parsed;
};

export default function ExpandedPlayer() {
  const { 
    currentTrack, isExpanded, setIsExpanded, isPlaying, togglePlay, 
    duration, audioRef, nextTrack, prevTrack, seekTo, queue,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat
  } = usePlayer();

  const [dominantColor, setDominantColor] = useState({ r: 255, g: 255, b: 255 });
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<{time: number, text: string}[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Referencias para manipulación directa del DOM (Alto Rendimiento para el Aura)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fftDataRef = useRef<number[]>(new Array(64).fill(0));
  const smoothedDataRef = useRef<number[]>(new Array(64).fill(0));
  const animationRef = useRef<number>();

  // 1. Efecto: Sincronización de Tiempo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExpanded) {
      interval = setInterval(() => {
        if (!isDragging && audioRef.current) {
           const time = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;
           setCurrentTime(time);
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isExpanded, isDragging, audioRef]);

  // 2. Efecto: Extracción de Color Vibrante de la Portada
  useEffect(() => {
    if (!currentTrack?.image) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = typeof currentTrack.image === 'string' ? currentTrack.image : currentTrack.image.src || '';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      
      let maxScore = 0;
      let bestColor = { r: 80, g: 80, b: 80 }; // Fallback

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        // Ignorar colores muy oscuros o muy brillantes
        if (luma > 30 && luma < 220) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const score = saturation * luma; // Lógica de Luma sofisticada
          if (score > maxScore) {
            maxScore = score;
            bestColor = { r, g, b };
          }
        }
      }
      setDominantColor(bestColor);
    };
  }, [currentTrack]);

  // 3. Efecto: Motor del Canvas FFT (El corazón visual)
  useEffect(() => {
    if (!isExpanded) return;

    const handleFft = (e: any) => {
      if (e.detail?.data) fftDataRef.current = e.detail.data;
    };
    window.addEventListener('fft_data', handleFft);

    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
      // Asegurar nitidez en pantallas Retina
      canvasRef.current.width = canvasRef.current.offsetWidth * window.devicePixelRatio;
      canvasRef.current.height = 60 * window.devicePixelRatio;
      if (ctxRef.current) ctxRef.current.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    const draw = () => {
      if (!canvasRef.current || !ctxRef.current) return;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      
      // Limpiar Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let bassSum = 0;
      let midSum = 0;
      const barCount = 64;
      const spacing = 3;
      const cssWidth = canvas.offsetWidth;
      const barWidth = (cssWidth - (spacing * (barCount - 1))) / barCount;

      for (let i = 0; i < barCount; i++) {
        // Suavizado Exponencial (El secreto de la fluidez)
        const targetValue = (fftDataRef.current[i] || 0) / 255;
        smoothedDataRef.current[i] = smoothedDataRef.current[i] * 0.70 + targetValue * 0.30;
        const val = smoothedDataRef.current[i];

        if (i < 10) bassSum += val;
        else if (i >= 10 && i < 30) midSum += val;

        const height = Math.max(4, val * 60);
        const x = i * (barWidth + spacing);
        
        // ¡LA CLAVE! Dibuja desde abajo: 60 (altura fija) - height
        const y = 60 - height;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, height, [2, 2, 0, 0]);
        } else {
          ctx.fillRect(x, y, barWidth, height);
        }
        ctx.fillStyle = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${0.3 + val * 0.7})`;
        ctx.fill();
      }

      // El Aura: Animación reactiva del DOM directa
      const bassImpact = bassSum / 10;
      const midImpact = midSum / 20;

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

  // 4. Efecto: Letras de la canción (Simulación API o Fetch real)
  useEffect(() => {
    if (currentTrack) {
      // Aquí iría tu fetch real a lrclib.net. Ponemos un placeholder de Karaoke para probar el 3D
      const dummyLrc = `[00:00.00] \n[00:05.00] Siente el bajo\n[00:10.00] Reactivando el sistema\n[00:15.00] Canvas dibujando desde abajo\n[00:20.00] Aura encendida`;
      setLyrics(parseLrc(dummyLrc));
    }
  }, [currentTrack]);


  if (!currentTrack || !isExpanded) return null;

  const colorString = `${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}`;
  const activeLyricIndex = lyrics.findIndex((l, i) => currentTime >= l.time && (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time));

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden"
      >
        {/* Fondo Radial (El Aura Reactiva) */}
        <div 
          ref={bgGlowRef}
          className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-full pointer-events-none transition-transform duration-75 ease-out"
          style={{
            background: `radial-gradient(circle at center, rgba(${colorString}, 0.5) 0%, rgba(0,0,0,0) 60%)`,
            mixBlendMode: 'screen'
          }}
        />

        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 relative z-10">
          <button onClick={() => setIsExpanded(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <ChevronDown size={28} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-widest text-white/60">REPRODUCIENDO DESDE</span>
            <span className="text-[13px] font-semibold">LIBRERÍA</span>
          </div>
          <button className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <MoreHorizontal size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-[500px] w-full mx-auto pb-8">
          
          {/* Zona de Carátula y Letras (Efecto Flip 3D) */}
          <div className="px-8 w-full aspect-square relative perspective-1000 cursor-pointer group" onClick={() => setShowLyrics(!showLyrics)}>
            <motion.div 
              animate={{ rotateY: showLyrics ? 180 : 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Cara Frontal: Carátula */}
              <div className="absolute inset-0 backface-hidden shadow-2xl rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <img 
                  src={typeof currentTrack.image === 'string' ? currentTrack.image : currentTrack.image?.src} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Cover"
                />
              </div>

              {/* Cara Trasera: Letras */}
              <div className="absolute inset-0 backface-hidden rounded-xl bg-black/80 backdrop-blur-3xl border border-white/10 overflow-hidden flex flex-col" style={{ transform: 'rotateY(180deg)' }}>
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth space-y-4 no-scrollbar pb-32">
                  {lyrics.length > 0 ? lyrics.map((lyric, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <p 
                        key={idx} 
                        className={`text-2xl font-bold transition-all duration-300 ${isActive ? 'text-white scale-110 origin-left blur-none' : 'text-white/30 blur-[1px]'}`}
                      >
                        {lyric.text}
                      </p>
                    )
                  }) : (
                    <div className="h-full flex items-center justify-center text-white/40 font-medium">Toca para volver</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visualizador FFT Native Canvas */}
          <div className="w-full h-[60px] px-8 mt-6">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* Información de Pista */}
          <div className="px-8 mt-6 flex justify-between items-center">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-lg text-white/60 truncate">{currentTrack.artist}</p>
                <span className="text-[9px] font-bold tracking-widest text-white/80 px-1.5 py-0.5 bg-white/10 border border-white/10 rounded">
                  LOSSLESS
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowDown size={18} />
              </button>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="px-8 mt-8">
            <div 
              className="h-1.5 bg-white/10 rounded-full relative cursor-pointer group"
              onPointerDown={(e) => {
                setIsDragging(true);
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                setCurrentTime(duration * Math.max(0, Math.min(1, pos)));
              }}
              onPointerMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                setCurrentTime(duration * Math.max(0, Math.min(1, pos)));
              }}
              onPointerUp={(e) => {
                setIsDragging(false);
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seekTo(duration * Math.max(0, Math.min(1, pos)));
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ 
                  width: `${(currentTime / (duration || 1)) * 100}%`,
                  backgroundColor: `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})`
                }}
              />
              <div 
                className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity pointer-events-none"
                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium font-mono text-white/50">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
          </div>

          {/* Controles de Reproducción */}
          <div className="px-8 mt-6 flex items-center justify-between">
            <button onClick={toggleShuffle} className={`p-2 transition-colors ${isShuffle ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>
              <Shuffle size={24} />
            </button>
            
            <button onClick={prevTrack} className="p-2 text-white hover:text-white/80 active:scale-90 transition-all">
              <SkipBack size={36} fill="currentColor" />
            </button>
            
            <button 
              ref={playBtnRef}
              onClick={togglePlay} 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white active:scale-95 transition-all duration-75"
              style={{ backgroundColor: `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})` }}
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            
            <button onClick={nextTrack} className="p-2 text-white hover:text-white/80 active:scale-90 transition-all">
              <SkipForward size={36} fill="currentColor" />
            </button>
            
            <button onClick={toggleRepeat} className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>
              <Repeat size={24} />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
