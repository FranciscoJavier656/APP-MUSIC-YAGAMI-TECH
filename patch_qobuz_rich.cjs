const fs = require('fs');

let qobuzCode = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

// Replace the getFeaturedAlbums
qobuzCode = qobuzCode.replace(
  /export const getFeaturedAlbums = async \(\) => \{[\s\S]*?\};/,
  `export const getFeaturedAlbums = async (type: string = 'new-releases') => {
  const res = await axios.get(\`/api/featured\`, { params: { type } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getFeaturedPlaylists = async () => {
  const res = await axios.get(\`/api/playlists\`);
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};`
);

fs.writeFileSync('src/lib/qobuz.ts', qobuzCode);
