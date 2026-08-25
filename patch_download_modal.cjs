const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

if (!code.includes('import { downloadTrackRouted }')) {
  code = code.replace(
    `import { getQobuzAlbum, getQobuzTrackUrl } from "../lib/qobuz";`,
    `import { getQobuzAlbum, getQobuzTrackUrl } from "../lib/qobuz";\nimport { downloadTrackRouted } from "../lib/DownloadManager";\nimport { Capacitor } from '@capacitor/core';`
  );
  
  // Replace the inside of handleDownload loop
  const targetLoop = `          const url = await getQobuzTrackUrl(track.id.toString(), format);
          if (url) {
            const filename = \`\${track.track_number?.toString().padStart(2, '0') || '01'} - \${(track.title || 'Track').replace(/[/\\\\?%*:|"<>]/g, '-')}.\${ext}\`;
            await downloadFileAsBlob(url, filename);
          }`;
          
  const replacementLoop = `          const success = await downloadTrackRouted(track, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }`;

  code = code.replace(targetLoop, replacementLoop);
  
  fs.writeFileSync('src/components/DownloadModal.tsx', code);
  console.log("Patched DownloadModal successfully");
} else {
  console.log("Already patched");
}
