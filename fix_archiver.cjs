const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/import archiver from "archiver";/g, 'const archiver = require("archiver");');
// Remove the top level import if it exists
code = code.replace(/import archiver from 'archiver';\n/g, '');
code = code.replace(/const archiver = require\("archiver"\);\n/g, '');
// Add it properly
code = code.replace("import axios from 'axios';", "import axios from 'axios';\nimport archiver from 'archiver';");
fs.writeFileSync('server.ts', code);
