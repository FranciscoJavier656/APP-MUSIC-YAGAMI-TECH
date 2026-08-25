const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadContext.tsx', 'utf8');

// Update ActiveDownload interface
code = code.replace(
  "status: 'queued' | 'downloading' | 'processing' | 'completed' | 'error';",
  "status: 'queued' | 'downloading' | 'processing_metadata' | 'importing_library' | 'organizing' | 'completed' | 'error';"
);

// Add listener for state changes
const setupTarget = "const setupListeners = async () => {";
const setupReplacement = `    let stateListener: any;\n    const setupListeners = async () => {`;
code = code.replace(setupTarget, setupReplacement);

const errorListenerTarget = `      errorListener = await YagamiManager.addListener('onDownloadError', (data: any) => {`;
const stateListenerCode = `      stateListener = await YagamiManager.addListener('onDownloadStateChange', (data: any) => {
        setActiveDownloads(prev => {
          if (!prev[data.trackId]) return prev;
          return {
            ...prev,
            [data.trackId]: { ...prev[data.trackId], status: data.status, progress: 1 } // Mantener al 100% durante el procesamiento
          };
        });
      });\n\n`;

code = code.replace(errorListenerTarget, stateListenerCode + errorListenerTarget);

const cleanupTarget = `if (errorListener) errorListener.remove();`;
code = code.replace(cleanupTarget, cleanupTarget + `\n      if (stateListener) stateListener.remove();`);

fs.writeFileSync('src/lib/DownloadContext.tsx', code);
console.log("Patched DownloadContext");
