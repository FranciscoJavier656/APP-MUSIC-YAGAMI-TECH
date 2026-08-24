const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// The closing tags are messed up. Let's fix them manually.
const parts = code.split('</AnimatePresence>');
if (parts.length > 1) {
  const lastPart = parts[1];
  code = parts[0] + '</AnimatePresence>\n    </div>\n  </>\n  );\n}';
  fs.writeFileSync('src/components/SearchTab.tsx', code);
}
