import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import axios from 'axios';
import { getQobuzTrackUrl } from './qobuz';

const downloadMap: Record<string, string> = {};

if (Capacitor.isNativePlatform()) {
  Filesystem.addListener('progress', (progress) => {
    const trackId = downloadMap[progress.url];
    if (trackId) {
      let percent = 0;
      if (progress.contentLength > 0) {
        percent = progress.bytes / progress.contentLength;
      } else {
        percent = Math.min(progress.bytes / 35_000_000, 0.95);
      }
      window.dispatchEvent(new CustomEvent('download_progress', {
        detail: { trackId, progress: percent }
      }));
    }
  });
}

export const downloadFileWeb = async (url: string, filename: string) => {
  const res = await axios.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

export const downloadTrackRouted = async (
  track: any, 
  formatId: string, 
  ext: string
): Promise<boolean> => {
  try {
    const url = await getQobuzTrackUrl(track.id.toString(), formatId);
    if (!url) return false;

    if (Capacitor.isNativePlatform()) {
      console.log(`[iOS] Encolando descarga nativa estable con Capacitor Filesystem: ${track.title}`);
      
      const trackId = track.id.toString();
      downloadMap[url] = trackId;
      const filename = `${trackId}.${ext}`;

      window.dispatchEvent(new CustomEvent('download_state', {
        detail: { trackId, status: 'downloading' }
      }));

      try {
        await Filesystem.downloadFile({
          url: url,
          path: `Downloads/${filename}`,
          directory: Directory.Data,
        });

        window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'processing_metadata' } }));
        await new Promise(r => setTimeout(r, 1200));
        
        window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'importing_library' } }));
        await new Promise(r => setTimeout(r, 1000));
        
        window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'organizing' } }));
        await new Promise(r => setTimeout(r, 800));
        
        window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'completed' } }));
        
        delete downloadMap[url];
        return true;
      } catch (e: any) {
        console.error("Error en Filesystem.downloadFile:", e);
        window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId, error: e.message || 'Error nativo' } }));
        delete downloadMap[url];
        return false;
      }
    }

    console.log(`[Web] Procesando descarga web: ${track.title}`);
    const filename = `${track.track_number?.toString().padStart(2, '0') || '01'} - ${(track.title || 'Track').replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
    await downloadFileWeb(url, filename);
    return true;
  } catch (e: any) {
    console.error("Fallo al descargar track", track.id, e);
    window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId: track.id.toString(), error: e.message || "Error" } }));
    return false;
  }
};
