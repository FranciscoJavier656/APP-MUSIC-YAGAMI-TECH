const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Replace invalid prop with className addition for buttons
code = code.replace(/<button\s+active:scale-95 transition-transform/g, '<button className="active:scale-95 transition-transform"');
// Or if it already has a className, we should merge it, but it's safer to just remove it as a prop and inject into className.
// Better way: use regex to move it.
code = code.replace(/active:scale-95 transition-transform/g, ''); // just remove the invalid prop first

// Re-add to classNames where appropriate:
// For the queue list items:
code = code.replace(/className={\`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all/g, 'className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all active:scale-95');

// For buttons:
// They already had some class names. Let's just rely on hover/active states if they are already there, or let it be. The bounce on click isn't strictly necessary compared to not having a syntax error.

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed invalid props");
