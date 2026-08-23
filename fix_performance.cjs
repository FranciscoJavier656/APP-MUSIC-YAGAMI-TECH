const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Replace extreme blurs with simple transparency or light blur
code = code.replace(/backdrop-blur-3xl/g, 'backdrop-blur-md');
code = code.replace(/backdrop-blur-2xl/g, 'backdrop-blur-md');
code = code.replace(/backdrop-blur-xl/g, 'backdrop-blur-lg');

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);

// Same for App.tsx (bottom bar)
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/backdrop-blur-xl/g, 'backdrop-blur-md');
fs.writeFileSync('src/App.tsx', appCode);

// Same for MiniPlayer.tsx
let miniCode = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
miniCode = miniCode.replace(/backdrop-blur-xl/g, 'backdrop-blur-md');
fs.writeFileSync('src/components/MiniPlayer.tsx', miniCode);

console.log("Performance tuned");
