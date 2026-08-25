const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

code = code.replace(
  "{ id: '27', label: 'FLAC Hi-Res', desc: '24-Bit / up to 192 kHz' }",
  "{ id: '28', label: 'FLAC Hi-Res', desc: '24-Bit / up to 192 kHz' }"
);

code = code.replace(
  "const [format, setFormat] = useState('5'); // 5=MP3 320, 6=FLAC 16-Bit, 7=FLAC 24-Bit 96kHz, 27=FLAC 24-Bit 192kHz",
  "const [format, setFormat] = useState('5');"
);

fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log("Patched DownloadModal format to 28");
