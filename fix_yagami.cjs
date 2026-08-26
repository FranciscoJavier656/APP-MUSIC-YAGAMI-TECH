const fs = require('fs');
let code = fs.readFileSync('src/components/YagamiLoader.tsx', 'utf8');
code = code.replace(/<style=\{`/g, '<style>{`');
fs.writeFileSync('src/components/YagamiLoader.tsx', code);
