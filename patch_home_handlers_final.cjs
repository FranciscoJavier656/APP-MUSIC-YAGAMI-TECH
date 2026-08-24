const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open playlist',\s*playlist\.id\)\}/g, "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}");
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open album',\s*item\.id\)\}/g, "onClick={() => setActiveItem({id: item.id, type: 'album'})}");

fs.writeFileSync('src/components/HomeTab.tsx', code);
