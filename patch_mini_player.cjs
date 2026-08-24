const fs = require('fs');
let code = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');

code = code.replace(/  if \(\!currentTrack\) return null;\n\n  const progressRef = useRef<HTMLDivElement>\(null\);/g, "  const progressRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (!currentTrack) return;\n");

// Wait, I need to be more precise to not break the hooks.
