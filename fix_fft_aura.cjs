const fs = require('fs');

// 1. PATCH FFTVisualizer.tsx to use the exact 'Aura' math from user's provided code
let fftCode = fs.readFileSync('src/components/FFTVisualizer.tsx', 'utf8');

const oldAverages = `              const bassImpact = isPlayingRef.current ? (bassAvg / 255) : 0;
              const midImpact = isPlayingRef.current ? (midAvg / 255) : 0; 
              
              smoothedBass = smoothedBass * 0.8 + bassImpact * 0.2;
              smoothedMid = smoothedMid * 0.8 + midImpact * 0.2;
              
              onFftAveragesRef.current(smoothedBass, smoothedMid);`;

const newAverages = `              const w = window as any;
              
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
              
              onFftAveragesRef.current(smoothedBass, w.auraSize);`;

fftCode = fftCode.replace(oldAverages, newAverages);
fs.writeFileSync('src/components/FFTVisualizer.tsx', fftCode, 'utf8');

// 2. PATCH ExpandedPlayer.tsx handleFftAverages
let expCode = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldHandle = `  const handleFftAverages = (bass, mid) => {
    if (bgGlowRef.current) {
      const scale = 1 + (bass * 0.15); 
      const opacity = Math.min(1, 0.4 + (mid * 0.4));
      
      bgGlowRef.current.style.transform = \`translateX(-50%) scale(\${scale})\`;
      bgGlowRef.current.style.opacity = \`\${opacity}\`;
    }
  };`;

const newHandle = `  const handleFftAverages = (bass: number, auraSize: number) => {
    if (bgGlowRef.current) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const baseOpacity = isDarkMode ? 0.45 : 0.35;
      
      const dynamicScale = Math.min(auraSize * 0.6, 0.6); 
      
      bgGlowRef.current.style.opacity = baseOpacity.toString();
      bgGlowRef.current.style.transform = \`translateX(-50%) scale(\${1 + dynamicScale})\`;
      bgGlowRef.current.style.filter = 'saturate(1.8) brightness(1.25)';
    }
    
    if (playButtonRef.current && dominantColor) {
      playButtonRef.current.style.boxShadow = \`0 10px 15px -3px \${dominantColor}80\`;
    }
  };`;

expCode = expCode.replace(oldHandle, newHandle);

// Fix the bgGlowRef layout style in ExpandedPlayer.tsx to match user's architecture perfectly 
// (while keeping translateX(-50%) because of absolute left-1/2 layout in the real app)
const oldGlow = `style={{
                background: \`radial-gradient(50% 50% at 50% 0%, \${dominantColor}73 0%, transparent 100%)\`,
                transform: 'translateX(-50%) scale(1)',
                transformOrigin: 'top center'
              }}`;
const newGlow = `style={{
                background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 80%)\`,
                transform: 'translateX(-50%) scale(1)',
                transformOrigin: 'top center'
              }}`;

expCode = expCode.replace(oldGlow, newGlow);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', expCode, 'utf8');
console.log('Patched Aura Math and UI updates');
