const fs = require('fs');

// We have 3 errors in App.tsx left:
// src/App.tsx(80,34): error TS2339: Property 'initializeTabBar' does not exist on type 'unknown'.
// src/App.tsx(84,45): error TS2339: Property 'addListener' does not exist on type 'unknown'.
// src/App.tsx(103,24): error TS2339: Property 'updateTab' does not exist on type 'unknown'.

// All the missing window and global variables that caused this.

let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will make sure the global casts work
code = code.replace(/window\.initializeTabBar/g, '(window as any).initializeTabBar');
code = code.replace(/window\.updateTab/g, '(window as any).updateTab');
code = code.replace(/App\.addListener/g, '(App as any).addListener');

fs.writeFileSync('src/App.tsx', code);
