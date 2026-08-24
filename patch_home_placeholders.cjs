const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Categories
code = code.replace(
  /<div key=\{cat\.title\} className="flex-none w-\[160px\] aspect-\[4\/3\] rounded-lg overflow-hidden relative cursor-pointer">/g,
  '<div key={cat.title} onClick={() => setActiveItem({id: "68995736", type: "playlist"})} className="flex-none w-[160px] aspect-[4/3] rounded-lg overflow-hidden relative cursor-pointer">'
);

// Karaoke
code = code.replace(
  /<div key=\{karaoke\.title\} className="flex-none w-\[200px\] cursor-pointer group">/g,
  '<div key={karaoke.title} onClick={() => setActiveItem({id: "13511417", type: "playlist"})} className="flex-none w-[200px] cursor-pointer group">'
);

// My Weekly Q
code = code.replace(
  /<div className="flex-none w-\[280px\] aspect-\[16\/9\] rounded-xl overflow-hidden relative cursor-pointer group">/g,
  '<div onClick={() => setActiveItem({id: "10967396", type: "playlist"})} className="flex-none w-[280px] aspect-[16/9] rounded-xl overflow-hidden relative cursor-pointer group">'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
