import { getQobuzTrackUrl } from "../lib/qobuz";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { getImageSrc } from "../lib/image";
import { QobuzAudio } from "../lib/QobuzAudioPlugin";
import axios from "axios";
import TrackContextMenu from './TrackContextMenu';
import DownloadModal from './DownloadModal';

export interface Track {
  local_path?: string;
  streamUrl?: string;
  id: string;
  title: string;
  artist: string;
  image: string;
  hires?: boolean;
  duration?: number;
  bitDepth?: number;
  samplingRate?: number;
  albumTitle?: string;
  releaseDate?: string;
  label?: string;
  composer?: string;
  copyright?: string;
}

interface PlayerContextType {
  contextMenuTrack: any | null;
  setContextMenuTrack: (track: any | null) => void;
  downloadItem: {item: any, type: 'album'|'track'} | null;
  setDownloadItem: (item: {item: any, type: 'album'|'track'} | null) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;

  duration: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  volume: number;
  queue: Track[];
  nextTrack: () => void;
  prevTrack: () => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: "off" | "all" | "one";
  toggleRepeat: () => void;
  analyser: any;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [contextMenuTrack, setContextMenuTrack] = useState<any | null>(null);
  const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolumeState] = useState(1);

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const repeatModeRef = useRef<"off" | "all" | "one">("off");
  const isShuffleRef = useRef(false);
  const playTrackRef = useRef<
    ((track: Track, newQueue?: Track[]) => void) | null
  >(null);
  const playRequestRef = useRef(0);

  // Keep refs in sync for event listeners
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    queueRef.current = queue;
    repeatModeRef.current = repeatMode;
    isShuffleRef.current = isShuffle;
  }, [currentTrack, queue, repeatMode, isShuffle]);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";

    const updateTime = () => {};

    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    let timeUpdateListener: any;
    let nativeEndListener: any;
    if (Capacitor.isNativePlatform()) {
      QobuzAudio.addListener("onTimeUpdate", (info) => {
        if (audioRef.current) {
          (audioRef.current as any).nativeCurrentTime = info.currentTime;
          (audioRef.current as any).nativeDuration = info.duration;
          setDuration(info.duration);
        }
      }).then((l) => (timeUpdateListener = l));

      QobuzAudio.addListener("onEnded", () => {
        handleTrackEnd();
      }).then((l) => (nativeEndListener = l));
    }

    const handleTrackEnd = () => {
      const mode = repeatModeRef.current;
      if (mode === "one") {
        if (Capacitor.isNativePlatform()) {
          seekTo(0);
          // togglePlay(); // handled by native or play() call if needed, wait, better to just playTrack again?
          if (playTrackRef.current && currentTrackRef.current) {
            playTrackRef.current(currentTrackRef.current);
          }
        } else {
          if (audioRef.current) audioRef.current.currentTime = 0;
          const playPromise = audioRef.current?.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => console.log("Playback interrupted:", e));
          }
        }
        return;
      }

      const q = queueRef.current;
      const current = currentTrackRef.current;
      if (!q.length || !current) {
        setIsPlaying(false);
        return;
      }

      const currentIndex = q.findIndex((t) => t.id === current.id);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex + 1;

      if (isShuffleRef.current) {
        nextIndex = Math.floor(Math.random() * q.length);
      } else if (nextIndex >= q.length) {
        if (mode === "all") {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }

      if (playTrackRef.current) {
        playTrackRef.current(q[nextIndex]);
      }
    };

    audio.addEventListener("ended", handleTrackEnd);

    audio.addEventListener("playing", () => setIsLoading(false));
    audio.addEventListener("waiting", () => setIsLoading(true));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleTrackEnd);
      if (timeUpdateListener) timeUpdateListener.remove();
      audio.pause();
      audio.removeAttribute("src");
    };
  }, []);

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    const requestId = ++playRequestRef.current;

    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);

    setIsLoading(true);
    setIsPlaying(false);

    setDuration(track.duration || 0); // initial guess from metadata

    try {
      let streamUrl = track.streamUrl || "";
      
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));
      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
         try {
             const stat = await Filesystem.getUri({
                 directory: Directory.Data,
                 path: lp.replace('file://', '')
             });
             streamUrl = stat.uri;
         } catch(e) {
             console.error("Failed to get local uri", e);
         }
      }

      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : `file://${track.local_path}`;
      } else if (!streamUrl) {
        streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      }

      if (requestId !== playRequestRef.current) return;

      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
          await QobuzAudio.play({ url: streamUrl });
          QobuzAudio.updateMetadata({
              title: track.title,
              artist: track.artist || "Desconocido",
              album: track.albumTitle || "Qobuz Audio",
              coverUrl: getImageSrc(track.image) || "",
              duration: track.duration || 0
          });
          setIsPlaying(true);
          setIsLoading(false);
          // Start a dummy interval to update time since native plugin handles playback
          // Native time is handled by onTimeUpdate listener
          if (false) {
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
            playPromise.catch((error) => {
              console.log("Playback interrupted:", error);
              console.log("Playback interrupted:", error);
            });
            setIsPlaying(true);
          }
        }
      }
    } catch (e) {
      if (requestId !== playRequestRef.current) return;
      console.error("Failed to play track", e);
      setIsLoading(false);
    }
  };

  playTrackRef.current = playTrack;

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      if (Capacitor.isNativePlatform()) {
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
          playPromise.catch((error) => {
            console.log("Playback interrupted:", error);
          });
        }
      }
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.seek({ time });
      }
    }
  };

  const setVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolumeState(vol);
    }
  };

  const nextTrack = () => {
    if (!queue.length || !currentTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = 0;
    }
    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (!queue.length || !currentTrack) return;

    // If we are more than 3 seconds in, just restart the track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    playTrack(queue[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };
  useEffect(() => {
      if ("mediaSession" in navigator && currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || "Desconocido",
          album: currentTrack.albumTitle || "Qobuz Audio",
          artwork: currentTrack.image ? [{ src: getImageSrc(currentTrack.image) || "",
                  sizes: "512x512",
                  type: "image/jpeg",
                },
                { src: getImageSrc(currentTrack.image) || "", sizes: "1024x1024",
                  type: "image/jpeg",
                }, // High-res
              ]
            : [],
        });
      }
    }, [currentTrack]);


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
    }, []);

    return (
      <PlayerContext.Provider
        value={{
          contextMenuTrack,
          setContextMenuTrack,
          downloadItem,
          setDownloadItem,
          currentTrack,
          isPlaying,
          isLoading,
          playTrack,
          togglePlay,
          duration,
          isExpanded,
          setIsExpanded,
          seekTo,
          volume,
          setVolume,
          queue,
          nextTrack,
          prevTrack,
          isShuffle,
          toggleShuffle,
          repeatMode,
          toggleRepeat,
          analyser: null,
          audioRef,
        }}
      >
        {children}
        <TrackContextMenu 
          track={contextMenuTrack} 
          onClose={() => setContextMenuTrack(null)}
          onDownload={() => {
            if (contextMenuTrack) {
              setDownloadItem({item: contextMenuTrack, type: 'track'});
            }
          }}
        />
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item}
            type={downloadItem.type}
            onClose={() => setDownloadItem(null)}
          />
        )}
      </PlayerContext.Provider>
    );
  };

  export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context)
      throw new Error("usePlayer must be used within PlayerProvider");
    return context;
  };
