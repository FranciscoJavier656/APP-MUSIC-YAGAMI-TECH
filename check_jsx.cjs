const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const lines = code.split('\n');

console.log(lines[209]);
console.log(lines[223]);
console.log(lines[326]);
console.log(lines[332]);
console.log(lines[350]);
console.log(lines[400]);

