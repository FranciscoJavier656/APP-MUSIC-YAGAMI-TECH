const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Replace imports if needed
code = code.replace(
  `import { useState, useRef, useEffect } from 'react';`,
  `import { useState, useRef, useEffect } from 'react';`
);

// We need to destructure audioRef instead of progress/currentTime
code = code.replace(
  /currentTrack, isPlaying, isLoading, togglePlay, progress, currentTime, duration,/,
  `currentTrack, isPlaying, isLoading, togglePlay, duration,\n    audioRef,`
);

// Insert refs and requestAnimationFrame code before return
const effectCode = `  const progressRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // We create a dummy data array to keep variables simple if no analyser
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      // 1. Update Progress UI
      if (audioRef.current && audioRef.current.duration) {
        const current = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        const percent = (current / dur) * 100;
        
        if (progressRef.current && !isScrubbing) {
          progressRef.current.style.width = \`\${percent}%\`;
        }
        if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
        if (remainingTimeRef.current) remainingTimeRef.current.textContent = "-" + formatTime(dur - current);
      }

      // 2. Draw Analyser
      if (ctx && canvas && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const bufferLength = analyser.frequencyBinCount;
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          // Soft iOS Blue
          ctx.fillStyle = \`rgba(0, 122, 255, \${0.3 + (dataArray[i]/255)*0.7})\`; 
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      }

      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [audioRef, analyser, isScrubbing]);
`;

code = code.replace(
  /const \[isScrubbing, setIsScrubbing\] = useState\(false\);/,
  `const [isScrubbing, setIsScrubbing] = useState(false);\n${effectCode}`
);

// Replace progress inline style and time formats with refs
code = code.replace(
  /<div \n                className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"\n                style=\{\{ width: \`\$\{progress\}%\` \}\}\n              \/>/,
  `<div \n                ref={progressRef}\n                className="h-full bg-black dark:bg-white rounded-full"\n                style={{ width: '0%' }}\n              />`
);

code = code.replace(
  /<span>\{formatTime\(currentTime\)\}<\/span>/,
  `<span ref={currentTimeRef}>0:00</span>`
);

code = code.replace(
  /<span>-\{formatTime\(duration - currentTime\)\}<\/span>/,
  `<span ref={remainingTimeRef}>-0:00</span>`
);

// Add Canvas right below the image container
code = code.replace(
  /<div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200\/50 dark:border-gray-700\/50 mb-8 mt-4">/,
  `<div className="w-full h-16 mb-4 mt-2">\n          <canvas ref={canvasRef} width={400} height={64} className="w-full h-full opacity-60" />\n        </div>\n        <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 mb-8 mt-4">`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Patched ExpandedPlayer");
