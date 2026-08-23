const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// It looks like:
//             </div>
//           </div>
//         )}
//           </div>
//   );
code = code.replace(
  /          <\/div>\n        \)\}\n          <\/div>\n  \);/g,
  `          </div>\n          </div>\n  );`
);

// also let's just do a manual replace in case spaces don't match
code = code.replace(
  /        \)\}\n          <\/div>\n  \);/,
  `          </div>\n  );`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed end");
