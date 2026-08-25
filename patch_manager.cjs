const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const target = `      try {
        await Filesystem.downloadFile({
          url: url,
          path: \`Downloads/\${filename}\`,
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
      }`;

const replacement = `      // Ejecutar en segundo plano para no bloquear la UI
      (async () => {
        try {
          await Filesystem.downloadFile({
            url: url,
            path: \`Downloads/\${filename}\`,
            directory: Directory.Data,
          });

          window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'processing_metadata' } }));
          await new Promise(r => setTimeout(r, 1200));
          
          window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'importing_library' } }));
          await new Promise(r => setTimeout(r, 1000));
          
          // Guardar en la librería local (IndexedDB / LocalStorage)
          try {
            const offlineLibrary = JSON.parse(localStorage.getItem('offline_tracks') || '{}');
            offlineLibrary[trackId] = {
              ...track,
              localPath: \`Downloads/\${filename}\`,
              downloadedAt: Date.now()
            };
            localStorage.setItem('offline_tracks', JSON.stringify(offlineLibrary));
          } catch(e) {
            console.error('Error saving to offline_tracks', e);
          }

          window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'organizing' } }));
          await new Promise(r => setTimeout(r, 800));
          
          window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'completed' } }));
          
          delete downloadMap[url];
        } catch (e: any) {
          console.error("Error en Filesystem.downloadFile:", e);
          window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId, error: e.message || 'Error nativo' } }));
          delete downloadMap[url];
        }
      })();
      return true;`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/lib/DownloadManager.ts', code);
  console.log("Patched DownloadManager!");
} else {
  console.log("Target not found!");
}
