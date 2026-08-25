const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

code = code.replace(
  "{ id: '28', label: 'FLAC Hi-Res', desc: '24-Bit / up to 192 kHz' }",
  "{ id: '27', label: 'FLAC Hi-Res', desc: '24-Bit / up to 192 kHz' }"
);

fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log("Reverted format to 27");
