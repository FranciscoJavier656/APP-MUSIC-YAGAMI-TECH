const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace("const qobuzAppId = process.env.QOBUZ_APP_ID || '';", "const qobuzAppId = process.env.QOBUZ_APP_ID || process.env.VITE_QOBUZ_APP_ID || '';");
serverCode = serverCode.replace("const qobuzSecret = process.env.QOBUZ_SECRET || '';", "const qobuzSecret = process.env.QOBUZ_SECRET || process.env.VITE_QOBUZ_APP_SECRET || '';");
serverCode = serverCode.replace("if (tokens.length > 0) qobuzToken = tokens[0];", "if (tokens.length > 0) qobuzToken = tokens[0];\n  if (!qobuzToken) qobuzToken = process.env.VITE_QOBUZ_USER_TOKEN || '';");

fs.writeFileSync('server.ts', serverCode);

let qobuzCode = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

qobuzCode = `import axios from 'axios';

export const searchQobuz = async (query: string) => {
  const res = await axios.get(\`/api/search\`, {
    params: { q: query }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzAlbum = async (albumId: string) => {
  const res = await axios.get(\`/api/album\`, {
    params: { album_id: albumId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzTrackUrl = async (trackId: string, formatId: string = '5') => {
  const res = await axios.get(\`/api/stream\`, {
    params: { track_id: trackId, format_id: formatId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.url;
};
`;

fs.writeFileSync('src/lib/qobuz.ts', qobuzCode);
