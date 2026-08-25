const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target = `    try {
      let streamUrl = "";
      if (track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else {
        streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      }`;

const replacement = `    try {
      let streamUrl = track.streamUrl || "";
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
