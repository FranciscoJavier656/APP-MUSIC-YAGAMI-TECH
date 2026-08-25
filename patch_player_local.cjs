const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const targetPlay = `    try {
      const streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");

      if (requestId !== playRequestRef.current) return;`;

const newPlay = `    try {
      let streamUrl = "";
      if (track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = Capacitor.convertFileSrc(track.local_path);
      } else {
        streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      }

      if (requestId !== playRequestRef.current) return;`;

if (code.includes(targetPlay)) {
  code = code.replace(targetPlay, newPlay);
  fs.writeFileSync('src/components/PlayerContext.tsx', code);
  console.log("Patched PlayerContext.tsx");
} else {
  console.log("Target not found in PlayerContext.tsx");
}
