const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `app.get('/api/playlist', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  const { playlist_id } = req.query;
  try {
    const response = await axios.get(\`\${qobuzApiBase}playlist/get\`, {
      params: { playlist_id, extra: 'tracks' },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Qobuz playlist error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});`;

if (!code.includes("app.get('/api/playlist',")) {
  code = code.replace("app.get('/api/playlists'", newEndpoint + "\n\napp.get('/api/playlists'");
  fs.writeFileSync('server.ts', code);
}
