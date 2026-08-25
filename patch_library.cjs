const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

if (!code.includes('useDownloads')) {
  code = code.replace(
    "import { usePlayer } from './PlayerContext';",
    "import { usePlayer } from './PlayerContext';\nimport { useDownloads } from '../lib/DownloadContext';\nimport { Download } from 'lucide-react';"
  );

  code = code.replace(
    "const { playTrack } = usePlayer();",
    "const { playTrack } = usePlayer();\n  const { activeDownloads } = useDownloads();\n  const activeDownloadList = Object.values(activeDownloads);"
  );
  
  const targetHeader = `      <div className="px-6 pt-16 pb-8 bg-white dark:bg-[#1C1C1E] shadow-sm mb-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold text-black dark:text-white">Tu Librería</h1>
        <p className="text-gray-500 mt-2 font-medium">Música descargada disponible offline</p>
      </div>`;

  const newHeader = targetHeader + `

      {activeDownloadList.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold text-black dark:text-white mb-3">Descargas Activas</h2>
          <div className="space-y-3">
            {activeDownloadList.map(dl => (
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
            ))}
          </div>
        </div>
      )}`;
      
  code = code.replace(targetHeader, newHeader);
  fs.writeFileSync('src/components/LibraryTab.tsx', code);
  console.log("Patched LibraryTab");
}
