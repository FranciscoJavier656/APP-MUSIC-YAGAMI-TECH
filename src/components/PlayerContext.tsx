import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { QobuzAudio } from "../lib/QobuzAudioPlugin";
import { getImageSrc } from "../lib/image";

// Ajusta esto a tu función real de la API
const getQobuzTrackUrl = async (id: string, quality: string) => `https://api.tu-backend.com/stream?id=${id}`;

export interface Track {
  id: string; title: string; artist: string; image: any; 
  localCoverPath?: string; localPath?: string; local_path?: string;
  original?: any; streamUrl?: string; album?: any; albumTitle?: string;
  duration?: number; performer?: any; subtitle?: string;
}

interface PlayerContextType {
  currentTrack: Track | null; isPlaying: boolean; isLoading: boolean;
  duration: number; isExpanded: boolean; volume: number; queue: Track[];
  isShuffle: boolean; repeatMode: "off" | "all" | "one";
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  contextMenuTrack: any; downloadItem: any;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => void; seekTo: (time: number) => void; setVolume: (vol: number) => void;
  nextTrack: () => void; prevTrack: () => void; toggleShuffle: () => void; toggleRepeat: () => void;
  setIsExpanded: (expanded: boolean) => void; setContextMenuTrack: (item: any) => void; setDownloadItem: (item: any) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [contextMenuTrack, setContextMenuTrack] = useState<any>(null);
  const [downloadItem, setDownloadItem] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequestRef = useRef(0);
  const trackInitializedRef = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";
    
    if (!Capacitor.isNativePlatform()) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        
        const sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        const dispatchFft = () => {
          if (!audio.paused) {
            analyserNode.getByteFrequencyData(dataArray);
            window.dispatchEvent(new CustomEvent('fft_data', { detail: { data: Array.from(dataArray) } }));
          }
          requestAnimationFrame(dispatchFft);
        };
        dispatchFft();
      } catch (e) { }
    }

    let timeUpdateListener: any;
    if (Capacitor.isNativePlatform()) {
      QobuzAudio.addListener("onTimeUpdate", (info) => {
        if (audioRef.current) {
          (audioRef.current as any).nativeCurrentTime = info.currentTime;
          (audioRef.current as any).nativeDuration = info.duration;
          setDuration(info.duration);
        }
      }).then(l => timeUpdateListener = l);
    } else {
        audio.addEventListener('timeupdate', () => { if (audio.duration) setDuration(audio.duration); });
    }
    
    return () => { if (timeUpdateListener) timeUpdateListener.remove(); };
  }, []);

  const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    if (!rawTrack) return;
    trackInitializedRef.current = true;
    let track = { ...rawTrack } as Track;
    if (!track.image) track.image = rawTrack.album?.image || rawTrack.original?.album?.image || rawTrack.original?.image || "";
    if (!track.artist || typeof track.artist !== 'string') track.artist = rawTrack.artist?.name || rawTrack.performer?.name || rawTrack.original?.artist?.name || rawTrack.subtitle || "Unknown Artist";

    const requestId = ++playRequestRef.current;
    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);

    setIsLoading(true);
    setIsPlaying(false);
    setDuration(track.duration || 0);

    try {
      let streamUrl = track.streamUrl || "";
      const finalCoverUrl = getImageSrc(track.image) || "";
      const lp = track.localPath || track.local_path;
      
      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
         try {
             const stat = await Filesystem.getUri({ directory: Directory.Data, path: lp.replace('file://', '') });
             streamUrl = stat.uri;
         } catch(e) {}
      }

      if (!streamUrl) streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      if (requestId !== playRequestRef.current) return;

      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
          await QobuzAudio.play({ url: streamUrl });
          QobuzAudio.updateMetadata({
              title: track.title, artist: track.artist || "Desconocido",
              album: track.albumTitle || "Qobuz Audio", coverUrl: finalCoverUrl, duration: track.duration || 0
          });
          setIsPlaying(true);
          setIsLoading(false);
        } else {
          audioRef.current.src = streamUrl;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => console.log("Playback interrupted:", error));
            setIsPlaying(true);
          }
        }
      }
    } catch (e) {
      if (requestId !== playRequestRef.current) return;
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (!trackInitializedRef.current) return playTrack(currentTrack);

    if (isPlaying) {
      if (Capacitor.isNativePlatform()) QobuzAudio.pause(); else audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (Capacitor.isNativePlatform()) QobuzAudio.resume(); else audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      if (Capacitor.isNativePlatform()) QobuzAudio.seek({ time });
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
    if (isShuffle) nextIndex = Math.floor(Math.random() * queue.length);
    else if (nextIndex >= queue.length) nextIndex = 0;
    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (!queue.length || !currentTrack) return;
    if (audioRef.current && ((audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime) > 3) {
      seekTo(0);
      return;
    }
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    playTrack(queue[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setRepeatMode((prev) => prev === "off" ? "all" : prev === "all" ? "one" : "off");

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
        if (details.seekTime !== undefined && details.seekTime !== null) seekToRef.current(details.seekTime);
      });
    }
    
    let promises: any[] = [];
    if (Capacitor.isNativePlatform()) {
        QobuzAudio.setupRemoteControls().catch(()=>{});
        promises.push(QobuzAudio.addListener('onRemotePlay', () => togglePlayRef.current()));
        promises.push(QobuzAudio.addListener('onRemotePause', () => togglePlayRef.current()));
        promises.push(QobuzAudio.addListener('onRemoteNext', () => nextTrackRef.current()));
        promises.push(QobuzAudio.addListener('onRemotePrev', () => prevTrackRef.current()));
        promises.push(QobuzAudio.addListener('onRemoteSeek', (info: any) => seekToRef.current(info.time)));
    }
    
    return () => {
       Promise.all(promises).then(listeners => { listeners.forEach(l => l && l.remove && l.remove()); });
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        contextMenuTrack, setContextMenuTrack, downloadItem, setDownloadItem,
        currentTrack, isPlaying, isLoading, playTrack, togglePlay,
        duration, isExpanded, setIsExpanded, seekTo, volume, setVolume,
        queue, nextTrack, prevTrack, isShuffle, toggleShuffle,
        repeatMode, toggleRepeat, audioRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
