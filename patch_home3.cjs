const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// The closing tags are messed up. Let's fix them manually.
const parts = code.split('</AnimatePresence>');
if (parts.length > 2) {
  const lastPart = parts[parts.length - 1];
  parts[parts.length - 1] = '\n    </div>\n  </>\n  );\n}';
  code = parts.join('</AnimatePresence>');
  fs.writeFileSync('src/components/HomeTab.tsx', code);
} else if (code.endsWith('</>\n  );\n}')) {
  // It's probably just missing the closing div
  code = code.replace('</>\n  );\n}', '</div>\n  </>\n  );\n}');
  fs.writeFileSync('src/components/HomeTab.tsx', code);
}
