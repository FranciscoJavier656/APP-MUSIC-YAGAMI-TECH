const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Mixes
code = code.replace(
  /<div key=\{item\.id \+ 'mix'\} className="flex-none w-\[160px\] cursor-pointer group">/g,
  '<div key={item.id + \'mix\'} onClick={() => setActiveItem({id: item.id.toString(), type: "playlist"})} className="flex-none w-[160px] cursor-pointer group">'
);

// Artistas similares
code = code.replace(
  /<div key=\{item\.id \+ 'artist'\} className="flex-none w-\[140px\] cursor-pointer group flex flex-col items-center text-center">/g,
  '<div key={item.id + \'artist\'} onClick={() => setActiveItem({id: item.id.toString(), type: "album"})} className="flex-none w-[140px] cursor-pointer group flex flex-col items-center text-center">'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
