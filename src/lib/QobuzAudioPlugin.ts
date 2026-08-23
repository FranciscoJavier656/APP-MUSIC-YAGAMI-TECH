import { registerPlugin } from '@capacitor/core';

export interface QobuzAudioPlugin {
  play(options: { url: string }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(options: { time: number }): Promise<void>;
  addListener(eventName: 'onFftData', listenerFunc: (info: { data: number[] }) => void): any;
}

export const QobuzAudio = registerPlugin<QobuzAudioPlugin>('QobuzAudio');
