const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*\);\s*}/g;
code = code.replace(regex, '        </div>\n      </div>\n    </div>\n  );\n}');

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
