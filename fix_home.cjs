const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/text = Audio' \}\}>/g, "text = Audio' }} />");
  code = code.replace(/text=Audio' \}\}>/g, "text=Audio' }} />");
  fs.writeFileSync(path, code);
};

fixFile('src/components/HomeTab.tsx');
fixFile('src/components/LibraryTab.tsx');
fixFile('src/components/SearchTab.tsx');
fixFile('src/components/AlbumCard.tsx');
fixFile('src/components/TrackItem.tsx');
fixFile('src/components/PlayerContext.tsx');
fixFile('src/components/MiniPlayer.tsx');
fixFile('src/components/Player.tsx');

