import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';

interface FFTVisualizerProps {
  barCount?: number;
  startIndex?: number;
  color?: string;
  className?: string;
  barWidth?: string;
  gap?: string;
  maxHeight?: number;
  minHeight?: number;
}

export function FFTVisualizer({ 
  barCount = 64, 
  startIndex = 0, 
  color = '#ffffff',
  className = '',
  barWidth = '3px',
  gap = '3px',
  maxHeight = 60,
  minHeight = 4
}: FFTVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    let smoothed = new Float32Array(barCount);
    
    const handleData = (data: number[]) => {
      if (!containerRef.current || !data) return;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = startIndex + i;
        const val = data[dataIndex] || 0;
        
        // Exponential smoothing
        smoothed[i] = smoothed[i] * 0.6 + val * 0.4;
        
        const bar = barsRef.current[i];
        if (bar) {
          const normalizedVal = smoothed[i] / 255;
          const h = Math.max(minHeight, normalizedVal * maxHeight);
          bar.style.height = `\${h}px`;
          bar.style.opacity = `\${0.3 + (normalizedVal * 0.7)}`;
        }
      }
    };

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
      if (capListener && capListener.remove) {
        capListener.remove();
      }
    };
  }, [barCount, startIndex, maxHeight, minHeight]);

  return (
    <div ref={containerRef} className={`flex items-end \${className}`} style={{ gap }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div 
          key={i}
          ref={el => { if (el) barsRef.current[i] = el; }}
          className="rounded-[2px]"
          style={{ width: barWidth, height: `\${minHeight}px`, backgroundColor: color, opacity: 0.3, transition: 'height 0.05s linear' }}
        />
      ))}
    </div>
  );
}
