const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');
code = code.replace(/return \(\n\s+<>\n/g, 'return (\n    <div className="h-full">\n');
code = code.replace(/<\/div>\n  \);\n\}/g, '</div>\n  );\n}');
// If there are multiple `</div>\n  );\n}`, just keep one.
const ending = '</div>\n  );\n}';
const lastIndex = code.lastIndexOf(ending);
if (lastIndex > 0) {
    code = code.substring(0, lastIndex + ending.length);
}
fs.writeFileSync('src/components/HomeTab.tsx', code);
