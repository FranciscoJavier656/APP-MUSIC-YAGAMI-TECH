const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Add import
code = code.replace(/import \{ usePlayer \} from '\.\/PlayerContext';/, "import { usePlayer } from './PlayerContext';\nimport { QobuzAudio } from '../lib/QobuzAudioPlugin';");

// Refactor Visualizer component to use Native FFT
const newVisualizer = `const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let listener: any;
    const bufferLength = 64;

    const setupListener = async () => {
      listener = await QobuzAudio.addListener('onFftData', (info) => {
        if (!isPlaying) return;
        const dataArray = info.data;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < Math.min(bufferLength, dataArray.length); i++) {
          barHeight = (dataArray[i] / 255) * height;
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          ctx.fillStyle = isDarkMode ? \`rgba(255, 255, 255, \${dataArray[i]/255 * 0.5})\` : \`rgba(0, 0, 0, \${dataArray[i]/255 * 0.5})\`;
          
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 1, barHeight, 4);
          ctx.fill();
          x += barWidth + 1;
        }
      });
    };
    
    setupListener();
    
    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [isPlaying]);

  return <canvas ref={canvasRef} width={200} height={40} className="w-full h-10 opacity-70" />;
};`;

code = code.replace(/const Visualizer = \(\{ isPlaying \}: \{ isPlaying: boolean \}\) => \{[\s\S]*?return <canvas[^>]*\/>;\n\};\n/m, newVisualizer + '\n');

// Refactor Big Canvas in ExpandedPlayer
const oldBigCanvasRegex = /\/\/ 2\. Draw Analyser \(Simulated to bypass iOS background WebAudio mute\)[\s\S]*?\}\n      \}/m;

const newBigCanvasCode = `// 2. Draw Analyser (Native iOS vDSP)
      if (ctx && canvas && (canvas as any).nativeFftData) {
        const dataArray = (canvas as any).nativeFftData;
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
        }
      }`;

code = code.replace(oldBigCanvasRegex, newBigCanvasCode);

// Add listener effect in ExpandedPlayer to update nativeFftData
const listenerEffect = `  useEffect(() => {
    let listener: any;
    const setup = async () => {
      listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
      });
    };
    setup();
    return () => { if (listener) listener.remove(); };
  }, []);
`;

code = code.replace(/  const \[dominantColor, setDominantColor\] = useState<string \| null>\(null\);\n/m, `  const [dominantColor, setDominantColor] = useState<string | null>(null);\n${listenerEffect}`);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Patched ExpandedPlayer for Native FFT");
