const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// 1. Add updateMetadata to the currentTrack effect
const oldEffect1 = `    useEffect(() => {
      if ("mediaSession" in navigator && currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || "Desconocido",
          album: currentTrack.albumTitle || "Qobuz Audio",
          artwork: currentTrack.image
            ? [
                {
                  src: currentTrack.image,
                  sizes: "512x512",
                  type: "image/jpeg",
                },
                {
                  src: currentTrack.image,
                  sizes: "1024x1024",
                  type: "image/jpeg",
                }, // High-res
              ]
            : [],
        });
      }
    }, [currentTrack]);`;

const newEffect1 = `    useEffect(() => {
      if ("mediaSession" in navigator && currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || "Desconocido",
          album: currentTrack.albumTitle || "Qobuz Audio",
          artwork: currentTrack.image
            ? [
                {
                  src: currentTrack.image,
                  sizes: "512x512",
                  type: "image/jpeg",
                },
                {
                  src: currentTrack.image,
                  sizes: "1024x1024",
                  type: "image/jpeg",
                }, // High-res
              ]
            : [],
        });
      }
      if (Capacitor.isNativePlatform() && currentTrack) {
          QobuzAudio.updateMetadata({
              title: currentTrack.title,
              artist: currentTrack.artist || "Desconocido",
              album: currentTrack.albumTitle || "Qobuz Audio",
              coverUrl: currentTrack.image || "",
              duration: currentTrack.duration || duration || 0
          });
      }
    }, [currentTrack]);`;

code = code.replace(oldEffect1, newEffect1);

// 2. Add native remote controls setup
const oldEffect2 = `    useEffect(() => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => togglePlay());
        navigator.mediaSession.setActionHandler("pause", () => togglePlay());
        navigator.mediaSession.setActionHandler("previoustrack", () =>
          prevTrack(),
        );
        navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            seekTo(details.seekTime);
          }
        });
      }
    }); // Run every render to capture fresh closures for nextTrack/prevTrack`;

const newEffect2 = `
    const nextTrackRef = useRef(nextTrack);
    const prevTrackRef = useRef(prevTrack);
    const togglePlayRef = useRef(togglePlay);
    const seekToRef = useRef(seekTo);

    useEffect(() => {
        nextTrackRef.current = nextTrack;
        prevTrackRef.current = prevTrack;
        togglePlayRef.current = togglePlay;
        seekToRef.current = seekTo;
    });

    useEffect(() => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => togglePlayRef.current());
        navigator.mediaSession.setActionHandler("pause", () => togglePlayRef.current());
        navigator.mediaSession.setActionHandler("previoustrack", () => prevTrackRef.current());
        navigator.mediaSession.setActionHandler("nexttrack", () => nextTrackRef.current());
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            seekToRef.current(details.seekTime);
          }
        });
      }
      
      let promises: any[] = [];
      if (Capacitor.isNativePlatform()) {
          QobuzAudio.setupRemoteControls();
          promises.push(QobuzAudio.addListener('onRemotePlay', () => togglePlayRef.current()));
          promises.push(QobuzAudio.addListener('onRemotePause', () => togglePlayRef.current()));
          promises.push(QobuzAudio.addListener('onRemoteNext', () => nextTrackRef.current()));
          promises.push(QobuzAudio.addListener('onRemotePrev', () => prevTrackRef.current()));
          promises.push(QobuzAudio.addListener('onRemoteSeek', (info: any) => seekToRef.current(info.time)));
      }
      
      return () => {
         if (promises.length > 0) {
            Promise.all(promises).then(listeners => {
               listeners.forEach(l => l && l.remove && l.remove());
            });
         }
      };
    }, []);`;

code = code.replace(oldEffect2, newEffect2);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
