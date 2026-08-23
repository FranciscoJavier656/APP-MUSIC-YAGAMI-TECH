const fs = require('fs');

let playerContext = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
playerContext = playerContext.replace('playTrack, togglePlay, progress,', 'playTrack, togglePlay,');
playerContext = playerContext.replace('currentTime, duration, isExpanded', 'duration, isExpanded');
playerContext = playerContext.replace('analyser\n    }}>', 'analyser,\n        audioRef\n    }}>');
fs.writeFileSync('src/components/PlayerContext.tsx', playerContext);

let expandedPlayer = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
expandedPlayer = expandedPlayer.replace(
  /className="h-full transition-all duration-75 relative"\s+style=\{\{ width: `\$\{progress\}%`, backgroundColor: dominantColor \|\| 'currentColor' \}\}/g,
  `ref={progressRef}
              className="h-full relative"
              style={{ width: '0%', backgroundColor: dominantColor || 'currentColor' }}`
);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', expandedPlayer);

console.log("Fixed progress references");
