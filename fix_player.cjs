const fs = require('fs');

let playerCode = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// Replace the axios API stream call with direct Qobuz call
playerCode = playerCode.replace(
  /const res = await axios\.get\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/stream`.*?\);[\s\S]*?if \(res\.data && res\.data\.url && audioRef\.current\) \{[\s\S]*?audioRef\.current\.src = res\.data\.url;/g,
  `const streamUrl = await getQobuzTrackUrl(track.id.toString(), '5');
      
      if (requestId !== playRequestRef.current) return;
      
      if (streamUrl && audioRef.current) {
        audioRef.current.src = streamUrl;`
);

// Also remove `audio.crossOrigin = "anonymous";` because iOS doesn't like that without CORS headers!
playerCode = playerCode.replace(/audio\.crossOrigin = "anonymous";/g, `// audio.crossOrigin = "anonymous"; // Disabled for iOS WebView compatibility`);

fs.writeFileSync('src/components/PlayerContext.tsx', playerCode);
console.log("Player fixed");
