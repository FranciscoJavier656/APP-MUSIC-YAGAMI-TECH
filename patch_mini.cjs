const fs = require('fs');

let code = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');

// Replace imports if needed
code = code.replace(
  `import { usePlayer } from './PlayerContext';`,
  `import { usePlayer } from './PlayerContext';\nimport { useEffect, useRef } from 'react';`
);

// Destructure audioRef instead of progress
code = code.replace(
  /const \{ currentTrack, isPlaying, isLoading, togglePlay, progress, isExpanded, setIsExpanded, nextTrack, prevTrack \} = usePlayer\(\);/,
  `const { currentTrack, isPlaying, isLoading, togglePlay, audioRef, isExpanded, setIsExpanded, nextTrack, prevTrack } = usePlayer();`
);

// Add local ref and effect for progress
const effectCode = `  const progressRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let animationId: number;
    const updateProgress = () => {
      if (audioRef.current && progressRef.current && audioRef.current.duration) {
        const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        progressRef.current.style.width = \`\${percent}%\`;
      }
      animationId = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => cancelAnimationFrame(animationId);
  }, [audioRef]);
`;

code = code.replace(
  /if \(!currentTrack\) return null;/,
  `if (!currentTrack) return null;\n${effectCode}`
);

// Replace progress inline style with ref
code = code.replace(
  /<div \n                className="h-full bg-\[#007AFF\] transition-all duration-300"\n                style=\{\{ width: \`\$\{progress\}%\` \}\}\n              \/>/,
  `<div \n                ref={progressRef}\n                className="h-full bg-[#007AFF]"\n                style={{ width: '0%' }}\n              />`
);

fs.writeFileSync('src/components/MiniPlayer.tsx', code);
console.log("Patched MiniPlayer");
