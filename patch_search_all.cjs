const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\([^)]+\)\}/g, (match) => {
    if (match.includes('playlist')) {
       return "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}";
    }
    if (match.includes('album')) {
       return "onClick={() => setActiveItem({id: album.id, type: 'album'})}";
    }
    return match;
});

fs.writeFileSync('src/components/SearchTab.tsx', code);
