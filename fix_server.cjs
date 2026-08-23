const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix archiver import
code = code.replace(/import archiver from 'archiver';/g, 'import * as archiver from "archiver";');

// Remove duplicate fs/util imports
// The first block is around line 10
// We will just do a regex to keep only the first occurrence or just replace all and add once
code = code.replace(/^import fs from 'fs';$/gm, '');
code = code.replace(/^import util from 'util';$/gm, '');

// Re-add them properly at the top
code = code.replace("import axios from 'axios';", "import axios from 'axios';\nimport fs from 'fs';\nimport util from 'util';");

// Fix the promises
code = code.replace(/new Promise\(\(resolve, reject\)/g, 'new Promise<void>((resolve, reject)');

fs.writeFileSync('server.ts', code);
