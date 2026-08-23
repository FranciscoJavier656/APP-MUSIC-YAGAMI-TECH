const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/import archiver from 'archiver';/, '// @ts-ignore\nimport archiver from "archiver";');
fs.writeFileSync('server.ts', code);
