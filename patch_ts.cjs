const fs = require('fs');

let code = fs.readFileSync('src/lib/QobuzAudioPlugin.ts', 'utf8');

if (!code.includes('updateMetadata')) {
    code = code.replace("pause(): Promise<void>;", "pause(): Promise<void>;\n  setupRemoteControls(): Promise<void>;\n  updateMetadata(options: { title: string, artist?: string, album?: string, coverUrl?: string, duration?: number }): Promise<void>;");
}
if (!code.includes('onRemotePlay')) {
    code = code.replace("addListener(eventName: 'onEnded', listenerFunc: () => void): any;", "addListener(eventName: 'onEnded', listenerFunc: () => void): any;\n  addListener(eventName: 'onRemotePlay', listenerFunc: () => void): any;\n  addListener(eventName: 'onRemotePause', listenerFunc: () => void): any;\n  addListener(eventName: 'onRemoteNext', listenerFunc: () => void): any;\n  addListener(eventName: 'onRemotePrev', listenerFunc: () => void): any;\n  addListener(eventName: 'onRemoteSeek', listenerFunc: (info: { time: number }) => void): any;");
}

fs.writeFileSync('src/lib/QobuzAudioPlugin.ts', code);
