const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update search
code = code.replace(
  "params: { query, limit, offset },",
  "params: { query, limit, offset, store_id: 'MX', country: 'MX' },"
);

fs.writeFileSync('server.ts', code);
