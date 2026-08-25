const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

if (!code.includes('useDownloads')) {
  code = code.replace(
    "import { downloadTrackRouted } from \"../lib/DownloadManager\";",
    "import { downloadTrackRouted } from \"../lib/DownloadManager\";\nimport { useDownloads } from \"../lib/DownloadContext\";"
  );

  code = code.replace(
    "const [progress, setProgress] = useState({ current: 0, total: 0 });",
    "const [progress, setProgress] = useState({ current: 0, total: 0 });\n  const { addDownload } = useDownloads();"
  );
  
  const target = `const success = await downloadTrackRouted(track, format, ext);`;
  const replacement = `if (Capacitor.isNativePlatform()) {
            addDownload(track.id.toString(), track);
          }
          const success = await downloadTrackRouted(track, format, ext);`;
          
  code = code.replace(target, replacement);

  fs.writeFileSync('src/components/DownloadModal.tsx', code);
  console.log("Patched DownloadModal to use context");
}
