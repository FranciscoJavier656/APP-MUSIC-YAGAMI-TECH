const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(/onClick=\{\(\)\s*=>\s*setSelectedAlbumId\([^)]+\)\}/g, "onClick={(e) => { e.preventDefault(); setActiveItem({id: item.id.toString(), type: 'album'}); }}");

fs.writeFileSync('src/components/HomeTab.tsx', code);
