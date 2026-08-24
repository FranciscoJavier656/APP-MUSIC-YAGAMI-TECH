const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// The first fix for QobuzAudio.updateMetadata is executed in useEffect when currentTrack changes.
// BUT we also need to make sure the native plugin resolves the updateMetadata promise and doesn't crash.
// More importantly, when we play a new track via play(), let's call updateMetadata as well just in case.

const oldPlay = `        if (Capacitor.isNativePlatform()) {
          await QobuzAudio.play({ url: streamUrl });
          setIsPlaying(true);
          setIsLoading(false);`;

const newPlay = `        if (Capacitor.isNativePlatform()) {
          await QobuzAudio.play({ url: streamUrl });
          QobuzAudio.updateMetadata({
              title: track.title,
              artist: track.artist || "Desconocido",
              album: track.albumTitle || "Qobuz Audio",
              coverUrl: track.image || "",
              duration: track.duration || 0
          });
          setIsPlaying(true);
          setIsLoading(false);`;

code = code.replace(oldPlay, newPlay);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
