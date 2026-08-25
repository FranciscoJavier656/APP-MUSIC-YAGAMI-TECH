const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

code = code.replace(
  "setStatus('done');",
  "if (Capacitor.isNativePlatform()) { setStatus('done'); setTimeout(() => onClose(), 800); } else { setStatus('done'); }"
);

fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log("Patched DownloadModal auto-close!");
