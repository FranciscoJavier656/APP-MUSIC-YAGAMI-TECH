const fs = require('fs');

// We have 3 errors in App.tsx left:
// src/App.tsx(40,26): error TS2339: Property 'error' does not exist on type 'Readonly<{}>'.
// src/App.tsx(41,26): error TS2339: Property 'error' does not exist on type 'Readonly<{}>'.

let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will make sure the global casts work
code = code.replace(/this\.state\.error/g, '(this.state as any).error');

fs.writeFileSync('src/App.tsx', code);
