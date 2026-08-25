const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadContext.tsx', 'utf8');
code = code.replace(
  'setupListeners();',
  `setupListeners();\n\n    const handleGlobalError = (e: any) => {\n      setActiveDownloads(prev => {\n        if (!prev[e.detail.trackId]) return prev;\n        return {\n          ...prev,\n          [e.detail.trackId]: { ...prev[e.detail.trackId], status: 'error', error: e.detail.error }\n        };\n      });\n    };\n    window.addEventListener("download_error", handleGlobalError);`
);
code = code.replace(
  'if (stateListener) stateListener.remove();',
  'if (stateListener) stateListener.remove();\n      window.removeEventListener("download_error", handleGlobalError);'
);
fs.writeFileSync('src/lib/DownloadContext.tsx', code);
console.log("Patched DownloadContext");
