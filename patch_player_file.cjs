const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const targetPlay = `      if (track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = Capacitor.convertFileSrc(track.local_path);
      } else {`;

const newPlay = `      if (track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else {`;

if (code.includes(targetPlay)) {
  code = code.replace(targetPlay, newPlay);
  fs.writeFileSync('src/components/PlayerContext.tsx', code);
  console.log("Patched local_path for native player");
}
