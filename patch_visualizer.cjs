const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// We need to replace the Visualizer component and the inline visualizer inside ExpandedPlayer
// to use Math.random() for bar heights when isPlaying is true.

const newVisualizer = `const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    const bufferLength = 64; // arbitrary number of bars
    const dataArray = new Uint8Array(bufferLength);
    
    // Simulate frequency data
    const simulateData = () => {
      for (let i = 0; i < bufferLength; i++) {
        if (isPlaying) {
           // Create a realistic looking EQ curve with random bouncing
           const base = Math.sin((i / bufferLength) * Math.PI) * 150;
           const random = Math.random() * 100;
           dataArray[i] = Math.max(0, Math.min(255, base + random - 50));
        } else {
           // Decay to 0
           dataArray[i] = Math.max(0, dataArray[i] - 10);
        }
      }
    };

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      
      simulateData();
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 255 * height;
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.fillStyle = isDarkMode ? \`rgba(255, 255, 255, \${dataArray[i]/255 * 0.5})\` : \`rgba(0, 0, 0, \${dataArray[i]/255 * 0.5})\`;
        
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth - 1, barHeight, 4);
        ctx.fill();
        x += barWidth + 1;
      }
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return <canvas ref={canvasRef} width={200} height={40} className="w-full h-10 opacity-70" />;
};`;

// Replace the old Visualizer
code = code.replace(/const Visualizer = \(\{ analyser, isPlaying \}: \{ analyser: AnalyserNode \| null, isPlaying: boolean \}\) => \{[\s\S]*?return <canvas[^>]*\/>;\n\};\n/m, newVisualizer + '\n');

// Update usage of Visualizer
code = code.replace(/<Visualizer analyser=\{analyser\} isPlaying=\{isPlaying\} \/>/g, '<Visualizer isPlaying={isPlaying} />');

// Now we need to fix the big canvas in ExpandedPlayer as well.
const oldBigCanvasCode = `// 2. Draw Analyser
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
      }`;

const newBigCanvasCode = `// 2. Draw Analyser (Simulated to bypass iOS background WebAudio mute)
      if (ctx && canvas) {
        const bufferLength = 64;
        if (!canvas.simulatedDataArray) canvas.simulatedDataArray = new Uint8Array(bufferLength);
        
        for (let i = 0; i < bufferLength; i++) {
          if (!audioRef.current?.paused) {
             const base = Math.sin((i / bufferLength) * Math.PI) * 150;
             const random = Math.random() * 100;
             canvas.simulatedDataArray[i] = Math.max(0, Math.min(255, base + random - 50));
          } else {
             canvas.simulatedDataArray[i] = Math.max(0, canvas.simulatedDataArray[i] - 10);
          }
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (canvas.simulatedDataArray[i] / 255) * canvas.height;
          // Soft iOS Blue
          ctx.fillStyle = \`rgba(0, 122, 255, \${0.3 + (canvas.simulatedDataArray[i]/255)*0.7})\`; 
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      }`;

code = code.replace(oldBigCanvasCode, newBigCanvasCode);

// There's a declaration for dataArray: `const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;`
code = code.replace(/const dataArray = analyser \? new Uint8Array\(analyser\.frequencyBinCount\) : null;/g, '');

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Patched Visualizer");
