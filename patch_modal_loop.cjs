const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

const target = `      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          if (Capacitor.isNativePlatform()) {
            addDownload(track.id.toString(), track);
          }
          const success = await downloadTrackRouted(track, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }
          // Delay slightly between tracks
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }`;

const replacement = `      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          if (Capacitor.isNativePlatform()) {
            addDownload(track.id.toString(), track);
          }
          const success = await downloadTrackRouted(track, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }
          
          if (!Capacitor.isNativePlatform()) {
             // Delay slightly between tracks on Web only since native is async queued
             await new Promise(r => setTimeout(r, 1000));
          }
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/DownloadModal.tsx', code);
  console.log("Patched loop");
} else {
  console.log("Loop not found");
}
