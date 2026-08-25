const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  /setActiveItem\(\{id: item\.id\.toString\(\, type: 'album'\}\)\)/g,
  "setActiveItem({id: item.id.toString(), type: 'album'})"
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
