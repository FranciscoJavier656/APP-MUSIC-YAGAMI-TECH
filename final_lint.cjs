const fs = require('fs');

// The original ExpandedPlayer code uses CSS styles like WebkitBackgroundClip on the elements.
// In TypeScript with React, the DOM style object keys are camelCased (webkitBackgroundClip).
// However, the user provided exact file had WebkitTextFillColor.
// Let's replace them back to the valid React TypeScript types without modifying logic.
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
code = code.replace(/WebkitBackgroundClip/g, 'webkitBackgroundClip');
code = code.replace(/WebkitTextFillColor/g, 'webkitTextFillColor');
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);

