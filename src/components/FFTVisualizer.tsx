import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';

interface FFTVisualizerProps {
  barCount?: number;
  startIndex?: number;
  color?: string;
  className?: string;
  barWidth?: string | number;
  gap?: string | number;
  maxHeight?: number;
  minHeight?: number;
  onFftAverages?: (bass: number, mid: number) => void;
}

export function FFTVisualizer({ 
  barCount = 64, 
  startIndex = 0, 
  color = '#ffffff',
  className = '',
  barWidth = 3,
  gap = 3,
  maxHeight = 60,
  minHeight = 3,
  onFftAverages
}: FFTVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Guardamos el callback en un ref para no reiniciar la animación en cada render
  const onFftAveragesRef = useRef(onFftAverages);
  useEffect(() => {
    onFftAveragesRef.current = onFftAverages;
  }, [onFftAverages]);

  useEffect(() => {
    let animationId: number;
    let latestData: number[] | null = null;
    
    // Suavizado exponencial (attack/decay) esencial para que las barras luzcan orgánicas
    const smoothedBars = new Float32Array(barCount);
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

      const parsedBarWidth = typeof barWidth === 'string' ? parseInt(barWidth) : barWidth;
      const parsedGap = typeof gap === 'string' ? parseInt(gap) : gap;

      const totalWidth = barCount * parsedBarWidth + (barCount - 1) * parsedGap;
      const startX = (width - totalWidth) / 2;

      let bassSum = 0;
      let midSum = 0;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = startIndex + i;
        const targetVal = latestData ? (latestData[dataIndex] || 0) : 0;
        
        // Sumas para el glow/scale del background
        if (i < 10) bassSum += targetVal;
        else if (i < 30) midSum += targetVal;

        // Filtro de suavizado (Attack / Decay) para el ecualizador visual
        // Si el valor sube, reacciona rápido (0.6), si baja, cae suavemente (0.8)
        if (targetVal > smoothedBars[i]) {
            smoothedBars[i] = smoothedBars[i] * 0.4 + targetVal * 0.6;
        } else {
            smoothedBars[i] = smoothedBars[i] * 0.8 + targetVal * 0.2;
        }

        const normalizedVal = smoothedBars[i] / 255;
        const h = Math.max(minHeight, normalizedVal * maxHeight);
        
        const x = startX + i * (parsedBarWidth + parsedGap);
        // ALINEADO ABAJO (Baseline) como el visualizador clásico
        const y = height - h;
        
        ctx.fillStyle = color;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, parsedBarWidth, h, parsedBarWidth / 2);
        } else {
            const r = parsedBarWidth / 2;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + parsedBarWidth - r, y);
            ctx.arcTo(x + parsedBarWidth, y, x + parsedBarWidth, y + r, r);
            ctx.lineTo(x + parsedBarWidth, y + h - r);
            ctx.arcTo(x + parsedBarWidth, y + h, x + parsedBarWidth - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
        }
        ctx.fill();
      }

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
  }, [barCount, startIndex, maxHeight, minHeight, color, barWidth, gap]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`\${className}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
