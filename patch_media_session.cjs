const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// We need to inject an effect that keeps mediaSession metadata in sync with currentTrack
const metadataEffect = `
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || 'Desconocido',
        album: currentTrack.albumTitle || 'Qobuz Audio',
        artwork: currentTrack.image ? [
          { src: currentTrack.image, sizes: '512x512', type: 'image/jpeg' },
          { src: currentTrack.image, sizes: '1024x1024', type: 'image/jpeg' } // High-res
        ] : []
      });
    }
  }, [currentTrack]);
`;

// Also inject action handlers. Because they rely on refs to avoid stale closures,
// or we can just bind them to the functions which read from refs.
// Since togglePlay, prevTrack, nextTrack do read from refs / latest state inside PlayerContext, wait...
// actually, togglePlay relies on audioRef.current which is stable. 
// nextTrack and prevTrack read from queue and currentTrack.
// Actually, nextTrack and prevTrack are not wrapped in useCallback, they read from closure state.
// So binding them directly in useEffect will capture stale state UNLESS we add them to the dependency array,
// or use refs for them. Wait, they are recreated every render.
// If we add them to a useEffect dependency array, the effect runs every render.
// Running `setActionHandler` every render is perfectly fine and standard for this API.

const actionsEffect = `
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
           seekTo(details.seekTime);
        }
      });
    }
  }); // Run every render to capture fresh closures for nextTrack/prevTrack
`;

// Insert the effects before the final return in PlayerProvider
code = code.replace(
  `  return (\n    <PlayerContext.Provider`,
  `${metadataEffect}\n${actionsEffect}\n  return (\n    <PlayerContext.Provider`
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched MediaSession");
