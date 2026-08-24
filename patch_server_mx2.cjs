const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update album
code = code.replace(
  "params: { album_id },",
  "params: { album_id, store_id: 'MX', country: 'MX' },"
);

// Update stream
code = code.replace(
  "params: {\n        format_id: 5,",
  "params: {\n        store_id: 'MX',\n        country: 'MX',\n        format_id: 5,"
);

code = code.replace(
  "params: {\n        format_id: format_id,",
  "params: {\n        store_id: 'MX',\n        country: 'MX',\n        format_id: format_id,"
);

fs.writeFileSync('server.ts', code);
