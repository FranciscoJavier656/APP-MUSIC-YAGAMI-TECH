const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(/<>/g, '<div className="h-full">');
code = code.replace(/<\/>/g, '</div>');

fs.writeFileSync('src/components/SearchTab.tsx', code);
