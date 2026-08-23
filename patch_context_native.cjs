const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// Add imports
code = code.replace(/import \{ createContext, useContext, useState, useEffect, useRef, ReactNode \} from 'react';/, "import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';\nimport { Capacitor } from '@capacitor/core';\nimport { QobuzAudio } from '../lib/QobuzAudioPlugin';");

// Inside playTrack
const oldPlayTryBlock = /      if \(streamUrl && audioRef\.current\) \{\n        audioRef\.current\.src = streamUrl;\n        const playPromise = audioRef\.current\.play\(\);\n        if \(playPromise !== undefined\) \{\n          playPromise\.catch\(error => \{\n            console\.log\("Playback interrupted:", error\);\n          \}\);\n        \}\n        setIsPlaying\(true\);\n      \}/;
const newPlayTryBlock = `      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
           await QobuzAudio.play({ url: streamUrl });
           setIsPlaying(true);
           setIsLoading(false);
           // Start a dummy interval to update time since native plugin handles playback
           if (!(window as any).nativeTimeInterval) {
             (window as any).nativeTimeInterval = setInterval(() => {
                if (audioRef.current) {
                   audioRef.current.currentTime += 0.5; // Dummy progression for UI
                }
             }, 500);
           }
        } else {
           audioRef.current.src = streamUrl;
           const playPromise = audioRef.current.play();
           if (playPromise !== undefined) {
             playPromise.catch(error => {
               console.log("Playback interrupted:", error);
             });
           }
           setIsPlaying(true);
        }
      }`;
code = code.replace(oldPlayTryBlock, newPlayTryBlock);

// Inside togglePlay
const oldTogglePlay = /      audioRef\.current\.pause\(\);\n      setIsPlaying\(false\);\n    \} else \{\n      const playPromise = audioRef\.current\.play\(\);\n      if \(playPromise !== undefined\) \{\n        playPromise\.catch\(error => \{\n          console\.log\("Playback interrupted:", error\);\n        \}\);\n      \}\n      setIsPlaying\(true\);\n    \}/;
const newTogglePlay = `      if (Capacitor.isNativePlatform()) {
         QobuzAudio.pause();
      } else {
         audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (Capacitor.isNativePlatform()) {
         QobuzAudio.resume();
      } else {
         const playPromise = audioRef.current.play();
         if (playPromise !== undefined) {
           playPromise.catch(error => {
             console.log("Playback interrupted:", error);
           });
         }
      }
      setIsPlaying(true);
    }`;
code = code.replace(oldTogglePlay, newTogglePlay);

// Inside seekTo
const oldSeekTo = /      audioRef\.current\.currentTime = time;/;
const newSeekTo = `      audioRef.current.currentTime = time;
      if (Capacitor.isNativePlatform()) {
         QobuzAudio.seek({ time });
      }`;
code = code.replace(oldSeekTo, newSeekTo);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched PlayerContext for Native Audio");
