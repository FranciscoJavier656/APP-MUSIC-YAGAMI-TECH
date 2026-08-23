const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const route = `
app.get('/api/downloadAlbumZip', async (req, res) => {
  const { album_id, format_id } = req.query;
  if (!album_id || !format_id) return res.status(400).json({ error: 'album_id and format_id are required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  const ext = format_id === '5' ? 'mp3' : 'flac';

  try {
    const albumRes = await axios.get(\`\${qobuzApiBase}album/get\`, {
      params: { album_id },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    const albumData = albumRes.data;
    const tracks = albumData.tracks?.items || [];
    if (!tracks.length) throw new Error("No tracks found in album");

    const safeAlbumTitle = (albumData.title || 'Album').replace(/[/\\\\?%*:|"<>]/g, '-');
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', \`attachment; filename="\${safeAlbumTitle}.zip"\`);

    const archive = archiver('zip', {
      zlib: { level: 0 }
    });

    archive.on('error', (err: any) => { throw err; });
    archive.pipe(res);

    const tempFiles = [];
    const cleanup = () => {
      for (const file of tempFiles) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    };
    
    res.on('finish', cleanup);
    res.on('close', cleanup);

    for (const track of tracks) {
      const track_id = track.id;
      const title = track.title || 'Unknown Title';
      const artist = track.performer?.name || track.artist?.name || 'Unknown Artist';
      const albumTitle = albumData.title || 'Unknown Album';
      const trackNum = track.track_number || '1';
      let coverUrl = albumData.image?.large || albumData.image?.small || track.image?.large;

      const rawPath = path.join('/tmp', \`\${track_id}_raw_\${Date.now()}.\${ext}\`);
      const coverPath = path.join('/tmp', \`\${track_id}_cover_\${Date.now()}.jpg\`);
      const finalPath = path.join('/tmp', \`\${track_id}_final_\${Date.now()}.\${ext}\`);
      tempFiles.push(rawPath, coverPath, finalPath);

      const timestamp = Math.floor(Date.now() / 1000);
      const r_sig = \`trackgetFileUrlformat_id\${format_id}intentstreamtrack_id\${track_id}\${timestamp}\${qobuzSecret}\`;
      const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

      const downloadUrlRes = await axios.get(\`\${qobuzApiBase}track/getFileUrl\`, {
        params: { format_id, intent: 'stream', track_id, request_ts: timestamp, request_sig: r_sig_hashed },
        headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
      });
      const streamUrl = downloadUrlRes.data.url;
      if (!streamUrl) continue;

      const audioRes = await axios({ method: 'get', url: streamUrl, responseType: 'stream' });
      const audioWriter = fs.createWriteStream(rawPath);
      audioRes.data.pipe(audioWriter);
      await new Promise((resolve, reject) => {
        audioWriter.on('finish', () => resolve());
        audioWriter.on('error', reject);
      });

      let hasCover = false;
      if (coverUrl) {
        try {
          const coverRes = await axios({ method: 'get', url: coverUrl, responseType: 'stream' });
          const coverWriter = fs.createWriteStream(coverPath);
          coverRes.data.pipe(coverWriter);
          await new Promise((resolve, reject) => {
            coverWriter.on('finish', () => resolve());
            coverWriter.on('error', reject);
          });
          hasCover = true;
        } catch (err) { }
      }

      const safeTitleMetadata = title.replace(/"/g, '\\\\"');
      const safeArtistMetadata = artist.replace(/"/g, '\\\\"');
      const safeAlbumMetadata = albumTitle.replace(/"/g, '\\\\"');
      
      let ffmpegCmd = '';
      if (ext === 'mp3') {
        if (hasCover) {
          ffmpegCmd = \`ffmpeg -y -i "\${rawPath}" -i "\${coverPath}" -map 0:a -map 1:v -c copy -id3v2_version 3 -metadata title="\${safeTitleMetadata}" -metadata artist="\${safeArtistMetadata}" -metadata album="\${safeAlbumMetadata}" -metadata track="\${trackNum}" "\${finalPath}"\`;
        } else {
          ffmpegCmd = \`ffmpeg -y -i "\${rawPath}" -c copy -id3v2_version 3 -metadata title="\${safeTitleMetadata}" -metadata artist="\${safeArtistMetadata}" -metadata album="\${safeAlbumMetadata}" -metadata track="\${trackNum}" "\${finalPath}"\`;
        }
      } else {
        if (hasCover) {
          ffmpegCmd = \`ffmpeg -y -i "\${rawPath}" -i "\${coverPath}" -map 0:a -map 1:v -c copy -disposition:v attached_pic -metadata title="\${safeTitleMetadata}" -metadata artist="\${safeArtistMetadata}" -metadata album="\${safeAlbumMetadata}" -metadata track="\${trackNum}" "\${finalPath}"\`;
        } else {
          ffmpegCmd = \`ffmpeg -y -i "\${rawPath}" -c copy -metadata title="\${safeTitleMetadata}" -metadata artist="\${safeArtistMetadata}" -metadata album="\${safeAlbumMetadata}" -metadata track="\${trackNum}" "\${finalPath}"\`;
        }
      }
      
      try {
        await execPromise(ffmpegCmd);
        const fileName = \`\${trackNum.toString().padStart(2, '0')} - \${title.replace(/[/\\\\?%*:|"<>]/g, '-')}.\${ext}\`;
        archive.append(fs.createReadStream(finalPath), { name: fileName });
      } catch (err) {
        console.error("FFmpeg failed for track", track_id, err);
      }
    }

    archive.finalize();
  } catch (error) {
    console.error('Album Zip error:', error?.response?.data || error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process album download' });
    }
  }
});
`;

code = code.replace('async function startServer() {', route + '\nasync function startServer() {');
fs.writeFileSync('server.ts', code);
