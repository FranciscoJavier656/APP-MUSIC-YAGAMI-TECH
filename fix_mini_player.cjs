const fs = require('fs');
let code = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
code = code.replace("  if (!currentTrack) return null;\n\n  const progressRef", "  const progressRef");
code = code.replace("  }, [audioRef]);", "  }, [audioRef]);\n\n  if (!currentTrack) return null;");
fs.writeFileSync('src/components/MiniPlayer.tsx', code);
