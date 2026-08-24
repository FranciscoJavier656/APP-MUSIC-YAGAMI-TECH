const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Just completely replace the end of the file.
const endPart = '        </div>\n      )}\n    </div>\n    </>\n  );\n}';

const lines = code.split('\n');
const lastDivIndex = lines.lastIndexOf('      )}');

if (lastDivIndex > 0) {
  // Take lines up to lastDivIndex + 1
  const newLines = lines.slice(0, lastDivIndex + 1);
  newLines.push('    </div>\n  );\n}');
  code = newLines.join('\n');
  
  // also we had a fragment tag `<>` at the start. Let's fix that.
  code = code.replace(/return \(\n\s+<>\n\s+<AnimatePresence mode="wait">/g, 'return (\n    <>\n      <AnimatePresence mode="wait">');
  
  // Remove the extraneous `</div>` and `</>` and `); }` stuff.
  
  fs.writeFileSync('src/components/HomeTab.tsx', code);
}
