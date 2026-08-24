import fs from 'fs';
let content = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Fix the missing closing brace
content = content.replace(/if \(Capacitor\.isNativePlatform\(\)\) \{ listener = await QobuzAudio\.addListener\('onFftData', \(info\) => \{(.*?)\}\);/gs, 
"if (Capacitor.isNativePlatform()) { listener = await QobuzAudio.addListener('onFftData', (info) => {$1}); }");

// Add Capacitor import if missing
if (!content.includes("import { Capacitor } from '@capacitor/core';")) {
    content = content.replace("import { QobuzAudio }", "import { Capacitor } from '@capacitor/core';\nimport { QobuzAudio }");
}

fs.writeFileSync('src/components/ExpandedPlayer.tsx', content);
