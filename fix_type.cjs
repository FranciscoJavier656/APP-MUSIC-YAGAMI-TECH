const fs = require('fs');

let expCode = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// The original ExpandedPlayer code uses a type inside a functional component which might fail in some linters, let's move it outside
const typeRegex = /type LyricLine = { time: number; text: string; duration: number };/g;
expCode = expCode.replace(typeRegex, '');
expCode = `type LyricLine = { time: number; text: string; duration: number };\n` + expCode;

fs.writeFileSync('src/components/ExpandedPlayer.tsx', expCode, 'utf8');
