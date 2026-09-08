import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';
import { usePlayer } from './PlayerContext';

interface FFTVisualizerProps {
  color?: string;
  className?: string;
  barCount?: number;
  startIndex?: number;
  onFftAverages?: (bass: number, mid: number) => void;
}

export function FFTVisualizer({ 
  color = '#ffffff', 
  className = '',
  barCount,
  startIndex = 0,
  onFftAverages
}: FFTVisualizerProps) {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Contexto para saber si está reproduciendo (para que las barras caigan a 0 en pausa)
  const { isPlaying } = usePlayer();
  const isPlayingRef = useRef(isPlaying);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  // Ref para la función de los promedios (luces ambientales)
  const onFftAveragesRef = useRef(onFftAverages);
  useEffect(() => {
    onFftAveragesRef.current = onFftAverages;
  }, [onFftAverages]);

  // Listener para recibir los datos (El Puente)
  useEffect(() => {
    let listener: any;
    const setup = async () => {
      
      if (Capacitor.isNativePlatform()) {
        listener = await QobuzAudio.addListener('onFftData', (info) => {
         // INYECCIÓN AL NODO DEL DOM: Seguro, sin problemas de closure de React
         if (canvasRef.current && info.data) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
        });
      } else {
        const webListener = (e: any) => {
          if (canvasRef.current && e.detail.data) {
             (canvasRef.current as any).nativeFftData = e.detail.data;
          }
        };
        window.addEventListener('fft_data', webListener);
        listener = { remove: () => window.removeEventListener('fft_data', webListener) };
      }

    };
    setup();
    return () => { if (listener) listener.remove(); };
  }, []); // Se ejecuta solo una vez al montar el componente

  // Bucle de Animación y Dibujo (Motor 60fps)
  useEffect(() => {
    let animationId: number;
    let timeoutId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // Variables para el suavizado de las luces ambientales (aura)
    let smoothedBass = 0;
    let smoothedMid = 0;
        
    const startDrawing = () => {
      const draw = () => {
        // 1. Verificamos que el canvas exista y tenga datos inyectados por el listener
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          // Si el componente recibe barCount (ej. MiniPlayer), lo respetamos, sino usamos todo el array
          const bufferLength = barCount || rawDataArray.length; 
          
          // Creamos el array de suavizado atado al DOM (persiste entre frames)
          if (!(canvas as any).smoothedFftData || (canvas as any).smoothedFftData.length !== bufferLength) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          // Limpiamos el frame anterior
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          // Extraemos los valores RGB del string de color
          let r = 255, g = 255, b = 255; 
          
          if (color.startsWith('rgb(')) {
             const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
             if (match) {
                 r = parseInt(match[1], 10);
                 g = parseInt(match[2], 10);
                 b = parseInt(match[3], 10);
             }
          } else if (color === '#ffffff') {
             r = 255; g = 255; b = 255;
          } else if (color === '#000000') {
             r = 0; g = 0; b = 0;
          } else if (color === 'currentColor') {
             // Adaptación para cuando le pasamos currentColor (Dark mode del mini player)
             const isDark = document.documentElement.classList.contains('dark');
             r = isDark ? 255 : 0;
             g = isDark ? 255 : 0;
             b = isDark ? 255 : 0;
          }
          const baseRgb = `${r}, ${g}, ${b}`;
          
          let bassSum = 0;
          let midSum = 0;
          
          // 2. Bucle de dibujo de las barras
          for (let i = 0; i < bufferLength; i++) {
            const dataIndex = startIndex + i;
            // Regla de Gravedad: Si está pausado, el target es 0.
            const targetValue = isPlayingRef.current ? (rawDataArray[dataIndex] || 0) : 0;
            
            // Recolectar datos para las luces ambientales
            if (i < 5) bassSum += targetValue;
            if (i >= Math.floor(bufferLength * 0.1) && i < Math.floor(bufferLength * 0.4)) {
                midSum += targetValue;
            }
            
            // Física: Suavizado Exponencial Exacto (0.7 / 0.3)
            smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;
            
            let barHeight = (smoothed[i] / 255) * canvas.height;
            if (barHeight < 3) barHeight = 3; // Altura mínima de reposo
            
            // Opacidad dinámica basada en la fuerza de la frecuencia
            ctx.fillStyle = `rgba(${baseRgb}, ${0.15 + (smoothed[i]/255)*0.85})`; 
            
            // Geometría: Puntas redondas arriba
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, canvas.height - barHeight, Math.max(1, barWidth - 2), barHeight, [4, 4, 0, 0]);
            } else {
              ctx.fillRect(x, canvas.height - barHeight, Math.max(1, barWidth - 2), barHeight);
            }
            ctx.fill();
            
            x += barWidth;
          }
          
          // 3. Procesar los promedios para las luces ambientales
          if (onFftAveragesRef.current) {
              const bassCount = Math.min(5, bufferLength);
              const midCount = Math.max(1, Math.floor(bufferLength * 0.4) - Math.floor(bufferLength * 0.1));
              
              const bassAvg = bassCount > 0 ? (bassSum / bassCount) : 0;
              const midAvg = midSum / midCount;
              
              const w = window as any;
              
              // Aura Math from Architecture Guide
              if (!w.baselineMid) w.baselineMid = midAvg;
              w.baselineMid = w.baselineMid * 0.95 + midAvg * 0.05;
              
              const spike = Math.max(0, midAvg - w.baselineMid);
              const rawMidImpact = isPlayingRef.current ? Math.min((spike / 20), 1.5) : 0;
              
              if (!w.auraSize) w.auraSize = 0;
              if (rawMidImpact > w.auraSize) {
                  w.auraSize = w.auraSize * 0.85 + rawMidImpact * 0.15; // Attack
              } else {
                  w.auraSize = w.auraSize * 0.95 + rawMidImpact * 0.05; // Decay
              }
              
              const bassImpact = isPlayingRef.current ? (bassAvg / 255) : 0;
              smoothedBass = smoothedBass * 0.8 + bassImpact * 0.2;
              
              onFftAveragesRef.current(smoothedBass, w.auraSize);
          }
        }

        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    // Timeout de 100ms heredado del ExpandedPlayer para prevenir tartamudeo en el montaje de la UI
    timeoutId = window.setTimeout(startDrawing, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [color, barCount, startIndex]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={60} 
      className={`w-full h-full ${className}`}
    />
  );
}
