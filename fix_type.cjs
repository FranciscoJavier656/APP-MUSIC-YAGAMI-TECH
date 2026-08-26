const fs = require('fs');

const file = 'src/components/DownloadModal.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/type: 'album' \| 'track';/g, "type: 'album' | 'track' | 'playlist';");
fs.writeFileSync(file, content);

const ctx = 'src/components/PlayerContext.tsx';
let ctxContent = fs.readFileSync(ctx, 'utf8');
ctxContent = ctxContent.replace(/type: 'album'\|'track'\|'playlist'\|'playlist'/g, "type: 'album'|'track'|'playlist'");
fs.writeFileSync(ctx, ctxContent);

console.log('done');
