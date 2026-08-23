const fs = require('fs');
const path = require('path');

const files = [
  'src/components/SearchTab.tsx',
  'src/components/AssistantTab.tsx',
  'src/components/PlayerContext.tsx',
  'src/components/AlbumView.tsx',
  'src/components/DownloadModal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace string literal Axios paths
  code = code.replace(/'\/api\/(search|chat|stream|album)'/g, '`${import.meta.env.VITE_API_BASE_URL || \'\'}/api/$1`');
  
  // Replace template literal paths in DownloadModal
  code = code.replace(/`\/api\/(downloadAlbumZip\?|downloadWithMetadata\?)/g, '`${import.meta.env.VITE_API_BASE_URL || \'\'}/api/$1');
  
  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
});
