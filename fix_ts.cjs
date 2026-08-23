const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(/if \(!canvas\.simulatedDataArray\) canvas\.simulatedDataArray = new Uint8Array\(bufferLength\);/g, "if (!(canvas as any).simulatedDataArray) (canvas as any).simulatedDataArray = new Uint8Array(bufferLength);");
code = code.replace(/canvas\.simulatedDataArray\[i\]/g, "(canvas as any).simulatedDataArray[i]");

// Update types in PlayerContext
let ctxCode = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
ctxCode = ctxCode.replace(/analyser: AnalyserNode \| null;/g, 'analyser: any;');
fs.writeFileSync('src/components/PlayerContext.tsx', ctxCode);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed TS");
