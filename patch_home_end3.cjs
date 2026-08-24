const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// The react fragment missing error means we have an unclosed tag.
// It's likely <AnimatePresence> or a fragment <>. Let's just fix it.
// Replace all <></> with <div className="h-full"></div>
code = code.replace(/<>/g, '<div className="h-full">');
code = code.replace(/<\/>/g, '</div>');

fs.writeFileSync('src/components/HomeTab.tsx', code);
