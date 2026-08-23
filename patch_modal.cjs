const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

const oldCode = `  const handleDownload = async () => {
    setStatus('fetching');
    try {
      let tracksToDownload = [];
      if (type === 'album') {
        const res = await axios.get('/api/album', { params: { album_id: item.id } });
        tracksToDownload = res.data.tracks?.items || [];
      } else {
        tracksToDownload = [item];
      }

      setProgress({ current: 0, total: tracksToDownload.length });
      setStatus('downloading');

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          const url = \`/api/downloadWithMetadata?track_id=\${track.id}&format_id=\${format}\`;
          
          // Trigger download via the server-side metadata tagging endpoint
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Delay to prevent overwhelming browser on full album downloads
          await new Promise(r => setTimeout(r, 2000));
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
  };`;

const newCode = `  const handleDownload = async () => {
    if (type === 'album') {
      setStatus('downloading');
      try {
        const url = \`/api/downloadAlbumZip?album_id=\${item.id}&format_id=\${format}\`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
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
          a.target = '_blank';
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
  };`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/DownloadModal.tsx', code);
