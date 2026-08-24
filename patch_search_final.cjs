const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

const oldEnd = '        )}\n      </AnimatePresence>\n    </div>\n    </div>\n  );\n}';
const newEnd = '        )}\n      </AnimatePresence>\n    </div>\n  );\n}';

code = code.replace(oldEnd, newEnd);

fs.writeFileSync('src/components/SearchTab.tsx', code);
