const fs = require('fs');
const f = 'src/lib/DownloadManager.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(
  "// Web mock",
  "// Web"
);
c = c.replace(
  "await downloadFileWeb(url, filename);",
  "// Usar el endpoint backend que incrusta metadatos (ffmpeg) en Web\n    const backendUrl = `/api/downloadWithMetadata?track_id=${trackId}&format_id=${formatId}`;\n    await downloadFileWeb(backendUrl, filename);"
);
fs.writeFileSync(f, c);
