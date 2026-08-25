const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
  "export interface Track {",
  "export interface Track {\n  local_path?: string;"
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
