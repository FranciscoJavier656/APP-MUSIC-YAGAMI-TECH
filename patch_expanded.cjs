const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  "const current = audioRef.current.currentTime;",
  "const current = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;"
);

code = code.replace(
  "const dur = audioRef.current.duration;",
  "const dur = (audioRef.current as any).nativeDuration ?? audioRef.current.duration;"
);

code = code.replace(
  "if (audioRef.current && audioRef.current.duration) {",
  "if (audioRef.current) {"
);

const oldFftLogic = `const dataArray = (canvas as any).nativeFftData;
        const bufferLength = dataArray.length;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          // Soft iOS Blue
          ctx.fillStyle = \`rgba(0, 122, 255, \${0.3 + (dataArray[i]/255)*0.7})\`; 
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }`;

const newFftLogic = `const dataArray = (canvas as any).nativeFftData;
        const bufferLength = dataArray.length;
        
        if (!(canvas as any).smoothedFftData) {
           (canvas as any).smoothedFftData = new Float32Array(bufferLength);
        }
        const smoothed = (canvas as any).smoothedFftData;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength);
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          // Exponential smoothing for buttery smooth animation
          smoothed[i] = smoothed[i] * 0.85 + dataArray[i] * 0.15;
          const barHeight = (smoothed[i] / 255) * canvas.height;
          
          // Use dominantColor or iOS Blue
          const r = dominantColor ? parseInt(dominantColor.slice(1,3), 16) : 0;
          const g = dominantColor ? parseInt(dominantColor.slice(3,5), 16) : 122;
          const b = dominantColor ? parseInt(dominantColor.slice(5,7), 16) : 255;
          
          ctx.fillStyle = \`rgba(\${r}, \${g}, \${b}, \${0.4 + (smoothed[i]/255)*0.6})\`; 
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }`;

code = code.replace(oldFftLogic, newFftLogic);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
