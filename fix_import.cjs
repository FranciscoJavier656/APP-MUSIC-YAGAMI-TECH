const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/\/\/ @ts-ignore\nimport archiver from "archiver";/, 'import archiver from "archiver";');
fs.writeFileSync('server.ts', code);
