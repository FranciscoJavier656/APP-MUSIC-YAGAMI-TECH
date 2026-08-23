const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Add seekInputRef
code = code.replace(
  `const progressRef = useRef<HTMLDivElement>(null);`,
  `const progressRef = useRef<HTMLDivElement>(null);\n  const seekInputRef = useRef<HTMLInputElement>(null);`
);

// Update input value in animation loop
code = code.replace(
  `if (progressRef.current && !isScrubbing) {\n          progressRef.current.style.width = \\\`\\\${percent}%\\\`;\n        }`,
  `if (!isScrubbing) {
          if (progressRef.current) progressRef.current.style.width = \`\${percent}%\`;
          if (seekInputRef.current) seekInputRef.current.value = percent.toString();
        }`
);

// Replace value={progress || 0} with defaultValue="0" and add ref
code = code.replace(
  `value={progress || 0}`,
  `defaultValue="0"\n            ref={seekInputRef}`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Patched ExpandedPlayer input");
