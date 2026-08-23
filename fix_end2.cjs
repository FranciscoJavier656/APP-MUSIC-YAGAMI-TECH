const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  /          <\/div>\n        \)\}\n          <\/div>\n  \);/g,
  `          </div>\n          </div>\n  );`
);

// If it's matching:
//             </div>
//           </div>
//         )}
//           </div>
//   );
code = code.replace(/        \)\}\n          <\/div>\n  \);/, `          </div>\n  );`);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed end 2");
