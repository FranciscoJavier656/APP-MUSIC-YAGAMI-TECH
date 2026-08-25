const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('DownloadProvider')) {
  code = code.replace(
    "import { PlayerProvider } from './components/PlayerContext';",
    "import { PlayerProvider } from './components/PlayerContext';\nimport { DownloadProvider } from './lib/DownloadContext';"
  );

  code = code.replace(
    "<PlayerProvider>",
    "<DownloadProvider>\n    <PlayerProvider>"
  );

  code = code.replace(
    "</PlayerProvider>",
    "</PlayerProvider>\n    </DownloadProvider>"
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx with DownloadProvider");
}
