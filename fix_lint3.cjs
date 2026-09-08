const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(/this\.props\.\(this\.props as any\)\.children/g, '(this.props as any).children');
fs.writeFileSync('src/App.tsx', appTsx);
