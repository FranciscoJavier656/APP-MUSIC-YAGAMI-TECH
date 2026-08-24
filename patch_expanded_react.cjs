const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldListener = `      listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current) {
            const BINS = 64;
            if (!(canvasRef.current as any).nativeFftData) {
               (canvasRef.current as any).nativeFftData = new Uint8Array(BINS);
            }
            const targetArray = (canvasRef.current as any).nativeFftData;
            const binaryString = atob(info.data);
            for (let i = 0; i < Math.min(BINS, binaryString.length); i++) {
               targetArray[i] = binaryString.charCodeAt(i);
            }
         }
      });`;

const newListener = `      listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current && info.data) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
      });`;

code = code.replace(oldListener, newListener);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);

let typesCode = fs.readFileSync('src/lib/QobuzAudioPlugin.ts', 'utf8');
typesCode = typesCode.replace("info: { data: string }", "info: { data: number[] }");
fs.writeFileSync('src/lib/QobuzAudioPlugin.ts', typesCode);
