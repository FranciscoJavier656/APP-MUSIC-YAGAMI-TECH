const fs = require('fs');
let file = 'src/components/ExpandedPlayer.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove // Sync FFT data block
content = content.replace(/\/\/ Sync FFT data[\s\S]*?\}, \[\]\);/g, '');

// 2. Remove canvas references in the main rendering loop
content = content.replace(/const canvas = canvasRef\.current;\s*const ctx = canvas\?\.getContext\('2d'\);/g, '');

fs.writeFileSync(file, content);
