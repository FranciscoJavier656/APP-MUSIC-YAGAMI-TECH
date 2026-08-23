const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
code = code.replace(
  'if (currentTime > 3) {',
  'if (audioRef.current && audioRef.current.currentTime > 3) {'
);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Fixed currentTime");
