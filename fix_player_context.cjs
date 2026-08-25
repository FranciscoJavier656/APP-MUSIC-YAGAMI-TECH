const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const valueStart = `value={{
          currentTrack,`;

const replacement = `value={{
          contextMenuTrack,
          setContextMenuTrack,
          downloadItem,
          setDownloadItem,
          currentTrack,`;

code = code.replace(valueStart, replacement);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
