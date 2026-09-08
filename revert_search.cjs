const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
code = code.replace(/type: "spring" as const/g, 'type: "spring"');
fs.writeFileSync('src/components/SearchTab.tsx', code);
