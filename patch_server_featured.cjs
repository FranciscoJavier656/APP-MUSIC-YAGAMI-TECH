const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const featuredEndpoint = `app.get('/api/featured', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  try {
    const response = await axios.get(\`\${qobuzApiBase}album/getFeatured\`, {
      params: { type: 'new-releases', limit: 15, store_id: 'MX', country: 'MX' },
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
`;

code = code.replace("app.get('/api/search',", featuredEndpoint + "\napp.get('/api/search',");
fs.writeFileSync('server.ts', code);
