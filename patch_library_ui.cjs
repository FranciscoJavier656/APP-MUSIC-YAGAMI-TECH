const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

const targetLoop = `{activeDownloadList.map(dl => (
              <div key={dl.trackId} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#007AFF] animate-pulse" />
                    <span className="font-semibold text-sm truncate max-w-[200px] text-black dark:text-white">
                      {dl.trackMetadata?.title || 'Descargando...'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#007AFF]">
                    {dl.status === 'completed' ? 'Completado' : \`\${Math.round(dl.progress * 100)}%\`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#007AFF] transition-all duration-300" 
                    style={{ width: \`\${dl.progress * 100}%\` }}
                  />
                </div>
              </div>
            ))}`;

const replacementLoop = `{activeDownloadList.map(dl => {
              const getStatusText = (status) => {
                switch(status) {
                  case 'queued': return 'En cola...';
                  case 'downloading': return 'Descargando archivo...';
                  case 'processing_metadata': return 'Incrustando metadatos (FLAC)...';
                  case 'importing_library': return 'Importando a librería offline...';
                  case 'organizing': return 'Organizando categorías...';
                  case 'completed': return '¡Completado exitosamente!';
                  case 'error': return 'Error en descarga';
                  default: return 'Procesando...';
                }
              };
              
              const isProcessing = ['processing_metadata', 'importing_library', 'organizing'].includes(dl.status);

              return (
              <div key={dl.trackId} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Download className={\`w-4 h-4 \${dl.status === 'completed' ? 'text-green-500' : 'text-[#007AFF] animate-pulse'}\`} />
                    <span className="font-bold text-sm truncate max-w-[180px] text-black dark:text-white">
                      {dl.trackMetadata?.title || 'Track'}
                    </span>
                  </div>
                  <span className={\`text-xs font-black \${dl.status === 'completed' ? 'text-green-500' : 'text-[#007AFF]'}\`}>
                    {dl.status === 'completed' || isProcessing ? '100%' : \`\${Math.round(dl.progress * 100)}%\`}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-gray-500 mb-2 truncate">
                  {getStatusText(dl.status)}
                </p>

                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={\`h-full transition-all duration-300 \${dl.status === 'completed' ? 'bg-green-500' : isProcessing ? 'bg-indigo-500 animate-pulse' : 'bg-[#007AFF]'}\`} 
                    style={{ width: \`\${dl.status === 'completed' || isProcessing ? 100 : dl.progress * 100}%\` }}
                  />
                </div>
              </div>
            )
            })}`;

if (code.includes(targetLoop)) {
  code = code.replace(targetLoop, replacementLoop);
  fs.writeFileSync('src/components/LibraryTab.tsx', code);
  console.log("Patched LibraryTab UI");
} else {
  console.log("Target loop not found in LibraryTab");
}
