const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(/onClick=\{[^}]*console\.log\('Open category',[^}]*\}\}/g, "onClick={() => setActiveItem({id: '68995736', type: 'playlist'})}"); // Placeholder since we don't have a category view

fs.writeFileSync('src/components/HomeTab.tsx', code);
