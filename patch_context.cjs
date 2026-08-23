const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// Add audioRef to Context Type
code = code.replace(
  /analyser: AnalyserNode \| null;/g,
  `analyser: AnalyserNode | null;\n  audioRef: React.MutableRefObject<HTMLAudioElement | null>;`
);

// Remove state declarations
code = code.replace(/const \[progress, setProgress\] = useState\(0\);/g, '');
code = code.replace(/const \[currentTime, setCurrentTime\] = useState\(0\);/g, '');

// Remove progress and currentTime from Context interface
code = code.replace(/progress: number;\n  currentTime: number;/g, '');

// Re-enable crossOrigin
code = code.replace(/\/\/ audio\.crossOrigin = "anonymous"; \/\/ Disabled for iOS WebView compatibility/g, 'audio.crossOrigin = "anonymous";');

// Remove updateTime usages
code = code.replace(/setCurrentTime\(audio\.currentTime\);\n      setProgress\(\(audio\.currentTime \/ audio\.duration\) \* 100 \|\| 0\);/g, '');

code = code.replace(/setProgress\(0\);\n    setCurrentTime\(0\);/g, '');

code = code.replace(/setCurrentTime\(time\);\n      setProgress\(\(time \/ duration\) \* 100 \|\| 0\);/g, '');

// Pass audioRef in the Provider value
code = code.replace(
  /analyser\n      \}\}/g,
  `analyser,\n        audioRef\n      }}`
);
code = code.replace(
  /toggleRepeat,\n        analyser\n      \}\}/g,
  `toggleRepeat,\n        analyser,\n        audioRef\n      }}`
);

// Remove the export variables from value if they are listed
code = code.replace(/progress,\n        currentTime,\n        /g, '');


fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched PlayerContext");
