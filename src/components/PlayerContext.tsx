import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { QobuzAudio } from "../lib/QobuzAudioPlugin";

import { getQobuzTrackUrl } from "../lib/qobuz";

export interface Track {
  id: string; title: string; artist: string; image: string; streamUrl?: string; duration?: number;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isExpanded: boolean;
  duration: number;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setIsExpanded: (expanded: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";
    
    // Si estamos en WEB (Navegador), usamos la API de Web Audio para la FFT
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
      } catch (e) { console.error(e) }
    }

    // Escuchador de tiempo (Nativo o Web)
    let timeListener: any;
    let fftListener: any;
    if (Capacitor.isNativePlatform()) {
      QobuzAudio.addListener("onTimeUpdate", (info) => {
        if (audioRef.current) {
          (audioRef.current as any).nativeCurrentTime = info.currentTime;
          setDuration(info.duration);
        }
      }).then(l => timeListener = l);
      
      QobuzAudio.addListener("onFftData", (info) => {
        if (info && info.data) {
          window.dispatchEvent(new CustomEvent('fft_data', { detail: { data: info.data } }));
        }
      }).then(l => fftListener = l);
    } else {
      audio.addEventListener('timeupdate', () => { if (audio.duration) setDuration(audio.duration); });
    }
    
    return () => { 
      if (timeListener) timeListener.remove(); 
      if (fftListener) fftListener.remove();
    };
  }, []);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    setDuration(track.duration || 0);
    
    let streamUrl = track.streamUrl;
    if (!streamUrl && track.id) {
      try {
        console.log("Fetching stream URL for track:", track.id);
        streamUrl = await getQobuzTrackUrl(track.id);
      } catch (e) {
        console.error("Failed to fetch stream URL", e);
        // Fallback to valid MP3 if API fails (or if we hit a preview limit without premium)
        streamUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
      }
    } else if (!streamUrl) {
      streamUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    }

    if (Capacitor.isNativePlatform()) {
      await QobuzAudio.play({ url: streamUrl });
      QobuzAudio.updateMetadata({ title: track.title, artist: track.artist, album: "Álbum", coverUrl: track.image, duration: track.duration || 0 });
      setIsPlaying(true);
    } else if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (Capacitor.isNativePlatform()) QobuzAudio.pause(); else audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (Capacitor.isNativePlatform()) QobuzAudio.resume(); else audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    if (Capacitor.isNativePlatform()) QobuzAudio.seek({ time });
  };

  // Implementa colas de reproducción reales en tu app
  const nextTrack = () => console.log("Next track");
  const prevTrack = () => console.log("Prev track");

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay, duration, isExpanded, setIsExpanded, seekTo, audioRef, nextTrack, prevTrack }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
