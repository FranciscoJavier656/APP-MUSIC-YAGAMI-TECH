const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// The "canta al ritmo" section uses `onClick={() => console.log('Open playlist', playlist.id)}`
// We need to fix all instances of this to use our setActiveItem state instead.
// I see I already did this, but let's make sure it covers ALL click handlers in HomeTab.

// Find all onClick={() => console.log(...)}
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\([^)]+\)\}/g, 
  (match) => {
    // If it's a playlist we want to open it
    if (match.includes('playlist')) {
       return "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}";
    }
    // If it's an album
    if (match.includes('album')) {
       return "onClick={() => setActiveItem({id: item.id, type: 'album'})}";
    }
    return match;
  }
);

// We should also look for item.id handlers in mostStreamed
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open album',\s*item\.id\)\}/g, "onClick={() => setActiveItem({id: item.id, type: 'album'})}");

// And the new releases
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open release',\s*item\.id\)\}/g, "onClick={() => setActiveItem({id: item.id, type: 'album'})}");

fs.writeFileSync('src/components/HomeTab.tsx', code);
