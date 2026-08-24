const fs = require('fs');

let qobuzCode = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

if (!qobuzCode.includes('getFeaturedAlbums')) {
  qobuzCode += `
export const getFeaturedAlbums = async () => {
  const res = await axios.get(\`/api/featured\`);
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};
`;
  fs.writeFileSync('src/lib/qobuz.ts', qobuzCode);
}

let homeCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

homeCode = homeCode.replace(
  "import { searchQobuz } from \"../lib/qobuz\";",
  "import { searchQobuz, getFeaturedAlbums } from \"../lib/qobuz\";"
);

homeCode = homeCode.replace(
  "const [resNew, resAudio] = await Promise.all([\n          searchQobuz('2024'),\n          searchQobuz('Audiophile')\n        ]);",
  "const [resNew, resAudio] = await Promise.all([\n          getFeaturedAlbums(),\n          searchQobuz('Audiófilo Mexico')\n        ]);"
);

fs.writeFileSync('src/components/HomeTab.tsx', homeCode);
