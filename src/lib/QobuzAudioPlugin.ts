import { registerPlugin } from '@capacitor/core';

export interface QobuzAudioPlugin {
  play(options: { url: string }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(options: { time: number }): Promise<void>;
  updateMetadata(options: { title: string, artist: string, album: string, coverUrl: string, duration: number }): Promise<void>;
  setupRemoteControls(): Promise<void>;
  
  // Eventos desde iOS hacia React
  addListener(eventName: 'onFftData', listenerFunc: (info: { data: number[] }) => void): Promise<any>;
  addListener(eventName: 'onTimeUpdate', listenerFunc: (info: { currentTime: number, duration: number }) => void): Promise<any>;
  
  // Controles desde el Centro de Control de iOS (Pantalla bloqueada)
  addListener(eventName: 'onRemotePlay', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemotePause', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemoteNext', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemotePrev', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemoteSeek', listenerFunc: (info: { time: number }) => void): Promise<any>;
}

export const QobuzAudio = registerPlugin<QobuzAudioPlugin>('QobuzAudioPlugin');
