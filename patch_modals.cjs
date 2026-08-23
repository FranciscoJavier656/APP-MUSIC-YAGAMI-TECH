const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Queue Modal replacement
code = code.replace(
  /\{showQueue && \(\s*<div className="absolute inset-0 z-50 bg-white\/95 dark:bg-\[#1C1C1E\]\/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-full duration-300 ease-\[cubic-bezier\(0\.32,0\.72,0,1\)\]"\s*>/g,
  `<div className={\`absolute inset-0 z-[70] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] \${showQueue ? 'translate-y-0' : 'translate-y-full'}\`}>`
);
// Remove the closing `)}` for showQueue
code = code.replace(
  /\s*\}\)\}\s*\{showCredits && \(/g,
  `\n        {showCredits && (`
);
// It might be followed by `{showCredits && (` or `</div>`
code = code.replace(
  /          <\/div>\n        \)\}\n        \{showCredits && \(/g,
  `          </div>\n        {showCredits && (`
);

// Credits Modal replacement
code = code.replace(
  /\{showCredits && \(\s*<div className="absolute inset-0 z-50 bg-white\/95 dark:bg-\[#1C1C1E\]\/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-full duration-300 ease-\[cubic-bezier\(0\.32,0\.72,0,1\)\]"\s*>/g,
  `<div className={\`absolute inset-0 z-[70] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] \${showCredits ? 'translate-y-0' : 'translate-y-full'}\`}>`
);
// Remove the closing `)}` for showCredits. The last `)}` is right before `</div>\n  );`
code = code.replace(
  /          <\/div>\n        \)\}\n          <\/div>\n  \);/g,
  `          </div>\n          </div>\n  );`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Patched Modals");
