import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { getQobuzTrackUrl } from './qobuz';

// Interfaz para el plugin nativo
export interface YagamiDownloadPlugin {
  downloadTrack(options: { 
    url: string; 
    trackId: string;
    title: string; 
    artist: string; 
    album: string;
    artworkUrl: string;
    format: string;
  }): Promise<{ status: string; trackId: string }>;
}

/**
 * Descarga estándar para Web (El método original y exacto)
 */
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

/**
 * Motor de descarga enrutado. Decide automáticamente si usar Web o iOS.
 */
export const downloadTrackRouted = async (
  track: any, 
  formatId: string, 
  ext: string
): Promise<boolean> => {
  try {
    const url = await getQobuzTrackUrl(track.id.toString(), formatId);
    if (!url) return false;

    // BIFURCACIÓN LIMPIA: WEB VS IOS
    if (Capacitor.isNativePlatform()) {
      
      // -- LÓGICA iOS NATIVA EN SEGUNDO PLANO --
      // Cargamos el plugin dinámicamente para no ensuciar el bundle web
      const Plugins = await import('@capacitor/core').then(m => m.Plugins) as any;
      const YagamiManager: YagamiDownloadPlugin = Plugins.YagamiDownloadManager;
      
      if (YagamiManager) {
        console.log(`[iOS] Encolando descarga nativa: ${track.title}`);
        await YagamiManager.downloadTrack({
          url: url,
          trackId: track.id.toString(),
          title: track.title || 'Unknown Title',
          artist: track.artist?.name || 'Unknown Artist',
          album: track.album?.title || 'Unknown Album',
          artworkUrl: track.image?.large || track.album?.image?.large || '',
          format: ext
        });
        
        // El progreso será manejado por EventListeners en un Context/Provider
        return true;
      } else {
        console.warn("[iOS] YagamiDownloadManager no registrado. Fallback a Web.");
        // Si no está instalado, caemos en la lógica web por seguridad (no debería pasar)
      }
    }

    // -- LÓGICA WEB ORIGINAL (INTACTA) --
    console.log(`[Web] Procesando descarga web: ${track.title}`);
    const filename = `${track.track_number?.toString().padStart(2, '0') || '01'} - ${(track.title || 'Track').replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
    await downloadFileWeb(url, filename);
    return true;

  } catch (e) {
    console.error("Fallo al descargar track", track.id, e);
    return false;
  }
};
