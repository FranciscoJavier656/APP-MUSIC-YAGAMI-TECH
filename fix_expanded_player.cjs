const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

if (!code.includes('import { Capacitor } from')) {
  code = code.replace("import { QobuzAudio } from '../lib/QobuzAudioPlugin';", "import { QobuzAudio } from '../lib/QobuzAudioPlugin';\nimport { Capacitor } from '@capacitor/core';");
}

code = code.replace(
  "listener = await QobuzAudio.addListener('onFftData', (info) => {",
  "if (Capacitor.isNativePlatform()) {\n        listener = await QobuzAudio.addListener('onFftData', (info) => {"
);
code = code.replace(
  "(canvasRef.current as any).nativeFftData = info.data;\n         }\n      });",
  "(canvasRef.current as any).nativeFftData = info.data;\n         }\n      });\n      }"
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
