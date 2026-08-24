const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newFeatured = `app.get('/api/featured', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  const type = req.query.type || 'new-releases';
  try {
    const response = await axios.get(\`\${qobuzApiBase}album/getFeatured\`, {
      params: { type, limit: 20, store_id: 'MX', country: 'MX' },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Qobuz featured error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get featured albums' });
  }
});

app.get('/api/playlists', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  try {
    const response = await axios.get(\`\${qobuzApiBase}playlist/getFeatured\`, {
      params: { type: 'editor-picks', limit: 15, store_id: 'MX', country: 'MX' },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Qobuz playlists error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});`;

// Replace existing featured endpoint
code = code.replace(/app\.get\('\/api\/featured'.*?\}\);/s, newFeatured);

fs.writeFileSync('server.ts', code);
