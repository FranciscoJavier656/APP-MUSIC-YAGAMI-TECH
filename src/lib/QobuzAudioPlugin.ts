import { registerPlugin } from '@capacitor/core';

export interface QobuzAudioPluginOptions {
  url: string;
}

export interface QobuzAudioPlugin {
  play(options: QobuzAudioPluginOptions): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(options: { time: number }): Promise<void>;
  updateMetadata(options: { title: string, artist: string, album: string, coverUrl: string, duration: number }): Promise<void>;
  setupRemoteControls(): Promise<void>;
  
  // Listeners
  addListener(eventName: 'onFftData', listenerFunc: (info: { data: number[] }) => void): Promise<any>;
  addListener(eventName: 'onTimeUpdate', listenerFunc: (info: { currentTime: number, duration: number }) => void): Promise<any>;
  addListener(eventName: 'onEnded', listenerFunc: () => void): Promise<any>;
  
  addListener(eventName: 'onRemotePlay', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemotePause', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemoteNext', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemotePrev', listenerFunc: () => void): Promise<any>;
  addListener(eventName: 'onRemoteSeek', listenerFunc: (info: { time: number }) => void): Promise<any>;
}

export const QobuzAudio = registerPlugin<QobuzAudioPlugin>('QobuzAudioPlugin');
