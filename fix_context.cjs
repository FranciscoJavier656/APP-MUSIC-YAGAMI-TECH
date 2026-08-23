const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// Fix missing React import for the ref
code = code.replace(`import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';`, `import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';`);

// Remove setProgress / setCurrentTime from seekTo
code = code.replace(/setCurrentTime\(time\);\n      setProgress\(\(time \/ duration\) \* 100 \|\| 0\);/g, '');

// If there are still setProgress calls, kill them
code = code.replace(/setProgress\(.*?\);/g, '');
code = code.replace(/setCurrentTime\(.*?\);/g, '');

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Context fixed");
