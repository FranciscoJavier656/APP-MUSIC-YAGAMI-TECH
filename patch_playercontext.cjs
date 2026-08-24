const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
  "audio.addEventListener('loadedmetadata', updateDuration);",
  "audio.addEventListener('loadedmetadata', updateDuration);\n    \n    let timeUpdateListener: any;\n    if (Capacitor.isNativePlatform()) {\n      QobuzAudio.addListener('onTimeUpdate', (info) => {\n        if (audioRef.current) {\n          (audioRef.current as any).nativeCurrentTime = info.currentTime;\n          (audioRef.current as any).nativeDuration = info.duration;\n          setDuration(info.duration);\n        }\n      }).then(l => timeUpdateListener = l);\n    }"
);

code = code.replace(
  "audio.removeEventListener('loadedmetadata', updateDuration);",
  "audio.removeEventListener('loadedmetadata', updateDuration);\n      if (timeUpdateListener) timeUpdateListener.remove();"
);

code = code.replace(
  "if (!(window as any).nativeTimeInterval) {",
  "// Native time is handled by onTimeUpdate listener\n           if (false) {"
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
