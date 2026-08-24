const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(/onClick=\{\(\)\s*=>\s*setSelectedAlbumId\([^)]+\)\}/g, "onClick={(e) => { e.preventDefault(); setActiveItem({id: album.id.toString(), type: 'album'}); }}");

fs.writeFileSync('src/components/SearchTab.tsx', code);
