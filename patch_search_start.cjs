const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(/return \(\n\s+<>\n/g, 'return (\n    <div className="h-full">\n');
fs.writeFileSync('src/components/SearchTab.tsx', code);
