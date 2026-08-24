const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldRef = `  const isScrubbingRef = useRef(false);
  const setIsScrubbing = (val: boolean) => {`;
  
const newRef = `  const isScrubbingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const setIsScrubbing = (val: boolean) => {`;

code = code.replace(oldRef, newRef);

const oldDraw = `        if (ctx && canvas && (canvas as any).nativeFftData) {
          const dataArray = (canvas as any).nativeFftData;
          const bufferLength = dataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Slight padding between bars
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const baseRgb = isDarkMode ? '255, 255, 255' : '0, 0, 0';
          
          for (let i = 0; i < bufferLength; i++) {
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + dataArray[i] * 0.30;`;

const newDraw = `        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          const bufferLength = rawDataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Slight padding between bars
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const baseRgb = isDarkMode ? '255, 255, 255' : '0, 0, 0';
          
          for (let i = 0; i < bufferLength; i++) {
            // If paused, force the target value to 0 so it decays smoothly
            const targetValue = isPlayingRef.current ? rawDataArray[i] : 0;
            
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;`;

code = code.replace(oldDraw, newDraw);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
