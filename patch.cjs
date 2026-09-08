const fs = require('fs');
let file = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add handleFftAverages
file = file.replace(
  'const bgGlowRef = useRef<HTMLDivElement>(null);',
  `const bgGlowRef = useRef<HTMLDivElement>(null);
  
  const handleFftAverages = (bass, mid) => {
    if (bgGlowRef.current) {
      const scale = 1 + (bass * 0.15); 
      const opacity = Math.min(1, 0.4 + (mid * 0.4));
      
      bgGlowRef.current.style.transform = \`translateX(-50%) scale(\${scale})\`;
      bgGlowRef.current.style.opacity = \`\${opacity}\`;
    }
  };`
);

// 2. Add ref and transition to Aura Background
file = file.replace(
  `          {/* Aura Background */}
          {dominantColor && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] max-w-[1200px] max-h-[1200px] pointer-events-none mix-blend-screen"
              style={{
                background: \`radial-gradient(50% 50% at 50% 0%, \${dominantColor}73 0%, transparent 100%)\`,
              }}
            />
          )}`,
  `          {/* Aura Background */}
          {dominantColor && (
            <div
              ref={bgGlowRef}
              className="absolute top-0 left-1/2 w-[120vw] h-[120vw] max-w-[1200px] max-h-[1200px] pointer-events-none mix-blend-screen transition-all duration-75 ease-out"
              style={{
                background: \`radial-gradient(50% 50% at 50% 0%, \${dominantColor}73 0%, transparent 100%)\`,
                transform: 'translateX(-50%) scale(1)',
                transformOrigin: 'top center'
              }}
            />
          )}`
);

// 3. Update FFTVisualizer props to add onFftAverages
file = file.replace(
  `<FFTVisualizer barCount={64} startIndex={0} maxHeight={60} minHeight={4} barWidth="3px" gap="3px" className="w-full mx-auto" color='currentColor' />`,
  `<FFTVisualizer barCount={64} startIndex={0} maxHeight={60} minHeight={3} barWidth={3} gap={3} className="w-full mx-auto" color='#ffffff' onFftAverages={handleFftAverages} />`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', file, 'utf8');
