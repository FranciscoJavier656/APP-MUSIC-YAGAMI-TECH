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
}

export function FFTVisualizer({ 
  barCount = 64, 
  startIndex = 0, 
  color = '#ffffff',
  className = '',
  barWidth = 3,
  gap = 3,
  maxHeight = 60,
  minHeight = 4
}: FFTVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let smoothed = new Float32Array(barCount);
    let animationId: number;
    let latestData: number[] | null = null;
    
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

      // Parse dimensions
      const parsedBarWidth = typeof barWidth === 'string' ? parseInt(barWidth) : barWidth;
      const parsedGap = typeof gap === 'string' ? parseInt(gap) : gap;

      // Determine colors based on the text color or prop
      const isBlack = color === '#000000' || color === 'black';
      const rgb = isBlack ? '0, 0, 0' : '255, 255, 255';

      // We want to fill the canvas width, but if it's too wide, center it.
      // Actually, if we want it to look exactly like the screenshot, it should span perfectly.
      // Let's calculate total width to center it within the canvas.
      const totalWidth = barCount * parsedBarWidth + (barCount - 1) * parsedGap;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = startIndex + i;
        const val = latestData ? (latestData[dataIndex] || 0) : 0;
        
        // Very smooth interpolation for that premium feel
        smoothed[i] = smoothed[i] * 0.75 + val * 0.25;
        
        const normalizedVal = smoothed[i] / 255;
        // Apply an easing curve to make the peaks look more dynamic and less linear
        const easedVal = Math.pow(normalizedVal, 1.2);
        const h = Math.max(minHeight, easedVal * maxHeight);
        
        const x = startX + i * (parsedBarWidth + parsedGap);
        // Vertically center the bars (mirrored up and down)
        const y = (height - h) / 2;

        const opacity = 0.25 + (normalizedVal * 0.75);
        
        ctx.fillStyle = `rgba(${rgb}, ${opacity})`;
        
        // Add a subtle bloom/glow effect
        ctx.shadowColor = `rgba(${rgb}, ${opacity * 0.8})`;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, parsedBarWidth, h, parsedBarWidth / 2);
        } else {
            // Fallback for older iOS Safari
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
        
        // Reset shadow for performance on next iteration (though we overwrite it)
        ctx.shadowBlur = 0;
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
      }).then(l => { capListener = l; });
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
      className={`${className}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
