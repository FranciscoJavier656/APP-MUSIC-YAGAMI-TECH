const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

// The messed up handleDownload starts around line 17 and ends around line 65
// Let's just find the start of handleDownload and the start of return (
const startIndex = code.indexOf('const handleDownload = async () => {\\');
const endIndex = code.indexOf('return (');

if (startIndex !== -1 && endIndex !== -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex);
  
  const newMiddle = `  const handleDownload = async () => {
    if (type === 'album') {
      setStatus('downloading');
      try {
        const url = \`/api/downloadAlbumZip?album_id=\${item.id}&format_id=\${format}\`;
        const a = document.createElement('a');
        a.href = url;
        a.download = \`\${item.title || 'Album'}.zip\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setStatus('done');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
      return;
    }

    setStatus('fetching');
    try {
      const tracksToDownload = [item];
      setProgress({ current: 0, total: tracksToDownload.length });
      setStatus('downloading');

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          const url = \`/api/downloadWithMetadata?track_id=\${track.id}&format_id=\${format}\`;
          const a = document.createElement('a');
          a.href = url;
          a.download = \`\${track.title || 'Track'}.mp3\`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.error("Failed to trigger download for track", track.id);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }
      setStatus('done');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  `;
  
  fs.writeFileSync('src/components/DownloadModal.tsx', before + newMiddle + after);
} else {
  console.log("Could not find boundaries");
}
