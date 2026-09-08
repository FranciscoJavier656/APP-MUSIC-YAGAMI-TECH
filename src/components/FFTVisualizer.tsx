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

  useEffect(() => {
    let animationId: number;
    let latestData: number[] | null = null;
    
    // Suavizado exponencial para los cálculos (attack/decay filter)
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
        // El plugin Swift ya envía la info perfectamente calculada, amplificada y suavizada
        const val = latestData ? (latestData[dataIndex] || 0) : 0;
        
        // Sumas para el glow/scale del background
        if (i < 10) bassSum += val;
        else if (i < 30) midSum += val;

        const normalizedVal = val / 255;
        // Sin smoothing ni easing falso en el frontend, dibujamos directamente la data nativa
        const h = Math.max(minHeight, normalizedVal * maxHeight);
        
        const x = startX + i * (parsedBarWidth + parsedGap);
        const y = (height - h) / 2;
        
        ctx.fillStyle = color; // Color solido como en la captura
        
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

      // Procesar luces ambientales (Glow / Escala)
      if (onFftAverages) {
        const avgBass = bassSum / 10;
        const avgMid = midSum / 20;
        
        smoothedBass = smoothedBass * 0.8 + avgBass * 0.2;
        smoothedMid = smoothedMid * 0.8 + avgMid * 0.2;
        
        onFftAverages(smoothedBass, smoothedMid);
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
  }, [barCount, startIndex, maxHeight, minHeight, color, barWidth, gap, onFftAverages]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`\${className}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
