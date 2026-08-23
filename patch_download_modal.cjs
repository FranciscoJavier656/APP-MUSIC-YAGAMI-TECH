const fs = require('fs');

let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

const importReplacement = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Loader2, CheckCircle, Music, Disc } from 'lucide-react';
import { getQobuzAlbum, getQobuzTrackUrl } from '../lib/qobuz';
import axios from 'axios';`;

code = code.replace(/^import React.*?\nimport axios from 'axios';\n?/m, importReplacement);

// We need to completely replace the handleDownload function.
const startIndex = code.indexOf('const handleDownload = async () => {');
const endIndex = code.indexOf('return (', startIndex);

const newHandleDownload = `const downloadFileAsBlob = async (url: string, filename: string) => {
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

  const handleDownload = async () => {
    setStatus('fetching');
    try {
      let tracksToDownload: any[] = [];
      let albumTitle = 'Album';

      if (type === 'album') {
        const albumData = await getQobuzAlbum(item.id.toString());
        tracksToDownload = albumData.tracks?.items || [];
        albumTitle = albumData.title || 'Album';
      } else {
        tracksToDownload = [item];
      }

      setProgress({ current: 0, total: tracksToDownload.length });
      setStatus('downloading');

      const ext = format === '5' ? 'mp3' : 'flac';

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          const url = await getQobuzTrackUrl(track.id.toString(), format);
          if (url) {
            const filename = \`\${track.track_number?.toString().padStart(2, '0') || '01'} - \${(track.title || 'Track').replace(/[/\\\\?%*:|"<>]/g, '-')}.\${ext}\`;
            await downloadFileAsBlob(url, filename);
          }
          // Delay slightly between tracks
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
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

code = code.substring(0, startIndex) + newHandleDownload + code.substring(endIndex);

fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log('Patched DownloadModal');
