const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target = `    try {
      let streamUrl = track.streamUrl || "";
      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else if (!streamUrl) {
        streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      }`;

const replacement = `    try {
      let streamUrl = track.streamUrl || "";
      
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));
      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
         try {
             const stat = await import('@capacitor/filesystem').then(m => m.Filesystem.getUri({
                 directory: m.Directory.Data,
                 path: lp.replace('file://', '')
             }));
             streamUrl = stat.uri;
         } catch(e) {
             console.error("Failed to get local uri", e);
         }
      }

      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else if (!streamUrl) {
        streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      }`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/PlayerContext.tsx', code.replace(target, replacement));
  console.log("Patched PlayerContext.tsx");
} else {
  console.log("Target not found in PlayerContext.tsx");
}
