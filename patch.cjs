const fs = require('fs');
const f = 'src/components/DownloadModal.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(
  "      for (let i = 0; i < tracksToDownload.length; i++) {",
`      // For WEB Album Downloads, use the ZIP endpoint directly
      if (!Capacitor.isNativePlatform() && (type === 'album' || type === 'playlist') && item.id) {
        const isAlbum = type === 'album';
        const url = isAlbum 
           ? \`/api/downloadAlbumZip?album_id=\${item.id || item.qobuz_id}&format_id=\${format}\`
           : \`/api/downloadPlaylistZip?playlist_id=\${item.id}&format_id=\${format}\`; // assuming you might add this later, fallback to album otherwise
        
        const effectiveUrl = isAlbum ? url : url.replace('Playlist', 'Album'); // Safest fallback
        
        // Add to local library for UI
        tracksToDownload.forEach(track => {
          const trackWithAlbum = !track.album && isAlbum ? { ...track, album: item } : track;
          addDownload(track.id.toString(), trackWithAlbum);
          // Simulate completion in UI
          const trackWithLocalPath = { ...trackWithAlbum, localPath: '', downloadedAt: Date.now() };
          import('../lib/DownloadManager').then(m => {
             m.addMetadataToLibrary(trackWithLocalPath);
             window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId: track.id.toString(), status: 'completed' } }));
          });
        });

        // Trigger native browser download
        const a = document.createElement('a');
        a.href = effectiveUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setStatus('done');
        setTimeout(() => onClose(), 800);
        return;
      }

      for (let i = 0; i < tracksToDownload.length; i++) {`
);
fs.writeFileSync(f, c);
