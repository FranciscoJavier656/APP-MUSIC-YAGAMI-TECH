const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Playlist Categories
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open category',\s*category\.id\)\}/g, "onClick={() => setActiveItem({id: category.id, type: 'playlist'})}");
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open playlist',\s*playlist\.id\)\}/g, "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}");

fs.writeFileSync('src/components/HomeTab.tsx', code);
