const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');
code = code.replace(
  'console.error("Fallo al descargar track", track.id, e);',
  'console.error("Fallo al descargar track", track.id, e);\n    // Dispatch global event for error\n    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("download_error", { detail: { trackId: track.id.toString(), error: e.message || "Error" } }));'
);
fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log("Patched DownloadManager");
