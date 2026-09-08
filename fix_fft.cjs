const fs = require('fs');

// 1. REWRITE FFTVisualizer.tsx
const fftContent = `import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';
import { usePlayer } from './PlayerContext';

interface FFTVisualizerProps {
  barCount?: number;
  startIndex?: number;
  color?: string;
  className?: string;
  onFftAverages?: (bass: number, mid: number) => void;
}

export function FFTVisualizer({ 
  barCount = 64, 
  startIndex = 0, 
  color = '#ffffff',
  className = '',
  onFftAverages
}: FFTVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying } = usePlayer();
  const isPlayingRef = useRef(isPlaying);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  const onFftAveragesRef = useRef(onFftAverages);
  useEffect(() => {
    onFftAveragesRef.current = onFftAverages;
  }, [onFftAverages]);

  useEffect(() => {
    let animationId: number;
    let latestData: number[] | null = null;
    
    const smoothed = new Float32Array(barCount);
    let smoothedBass = 0;
    let smoothedMid = 0;
    
    const handleData = (data: number[]) => {
      latestData = data;
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      let x = 0;

      let bassSum = 0;
      let midSum = 0;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = startIndex + i;
        // Si está en pausa, forzamos 0 para que las barras caigan suavemente
        const targetValue = (isPlayingRef.current && latestData) ? (latestData[dataIndex] || 0) : 0;
        
        if (i < 10) bassSum += targetValue;
        else if (i < 30) midSum += targetValue;

        // Suavizado Exponencial (70% frame anterior, 30% nuevo frame) exacto
        smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;
        
        let barHeight = (smoothed[i] / 255) * height;
        if (barHeight < 3) barHeight = 3;
        
        // Color con opacidad dinámica
        const alpha = 0.15 + (smoothed[i] / 255) * 0.85;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            // Bordes redondeados arriba (4px de radio)
            ctx.roundRect(x, height - barHeight, Math.max(1, barWidth - 2), barHeight, [4, 4, 0, 0]);
        } else {
            ctx.fillRect(x, height - barHeight, Math.max(1, barWidth - 2), barHeight);
        }
        ctx.fill();
        
        x += barWidth;
      }
      
      ctx.globalAlpha = 1.0;

      if (onFftAveragesRef.current) {
        const avgBass = bassSum / 10;
        const avgMid = midSum / 20;
        smoothedBass = smoothedBass * 0.8 + avgBass * 0.2;
        smoothedMid = smoothedMid * 0.8 + avgMid * 0.2;
        onFftAveragesRef.current(smoothedBass, smoothedMid);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    let capListener: any = null;
    if (Capacitor.isNativePlatform()) {
      QobuzAudio.addListener('onFftData', (info: any) => {
        if (info && info.data) {
          handleData(info.data);
        }
      }).then((l: any) => { capListener = l; });
    } else {
      const webListener = (e: any) => handleData(e.detail.data);
      window.addEventListener('fft_data', webListener);
      capListener = { remove: () => window.removeEventListener('fft_data', webListener) };
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (capListener && capListener.remove) {
        capListener.remove();
      }
    };
  }, [barCount, startIndex, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className={\`\${className}\`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
`;
fs.writeFileSync('src/components/FFTVisualizer.tsx', fftContent, 'utf8');

// 2. PATCH ExpandedPlayer.tsx
let expanded = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Container replace
const oldContainer = `<div className="px-8 mt-4 sm:mt-6 h-[40px] sm:h-[60px] flex items-center justify-center w-full max-w-[450px] mx-auto">
              <FFTVisualizer barCount={64} startIndex={0} maxHeight={60} minHeight={3} barWidth={3} gap={3} className="w-full mx-auto" color='#ffffff' onFftAverages={handleFftAverages} />
            </div>`;
const newContainer = `<div className="h-16 w-full max-w-[320px] sm:max-w-[400px] mx-auto mt-4 mb-2 flex items-end">
              <FFTVisualizer barCount={64} startIndex={0} className="w-full h-full" color="#ffffff" onFftAverages={handleFftAverages} />
            </div>`;
expanded = expanded.replace(oldContainer, newContainer);

// Queue FFTVisualizer replace
expanded = expanded.replace(
  /<FFTVisualizer barCount=\{4\} startIndex=\{24\}[^>]*\/>/g,
  `<FFTVisualizer barCount={4} startIndex={24} className="w-full h-full" color="#ffffff" />`
);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', expanded, 'utf8');

// 3. PATCH MiniPlayer.tsx
let mini = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
mini = mini.replace(
  /<FFTVisualizer barCount=\{16\} startIndex=\{24\}[^>]*\/>/g,
  `<FFTVisualizer barCount={16} startIndex={24} className="w-full h-full text-black dark:text-white" color="currentColor" />`
);
fs.writeFileSync('src/components/MiniPlayer.tsx', mini, 'utf8');

console.log('Fixed FFT visualizer geometry and components.');
