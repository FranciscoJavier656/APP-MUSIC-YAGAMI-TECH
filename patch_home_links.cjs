const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// The `setSelectedAlbumId` state itself might not be removed, let's just make sure clicks actually work.
code = code.replace(/<div key=\{playlist\.id\}\s+className="[^"]+"\s+onClick=\{\(\) => console\.log\([^)]+\)\}/g, (match) => match.replace(/onClick=\{\(\) => console\.log\([^)]+\)\}/, "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}"));

fs.writeFileSync('src/components/HomeTab.tsx', code);
