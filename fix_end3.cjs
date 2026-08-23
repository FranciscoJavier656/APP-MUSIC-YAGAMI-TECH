const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// The end of the file looks like:
//             </div>
//           </div>
//         )}
//           </div>
//   );
// }

code = code.replace("        )}\n          </div>\n  );\n}", "          </div>\n  );\n}");

// Just to be sure, let's remove any ")}\n" followed by "</div>"
code = code.replace(/}\)\}\s*<\/div>\s*\);\s*\}/, "}\n          </div>\n  );\n}");
code = code.replace(/\)\}\s*<\/div>\s*\);\s*\}/, "          </div>\n  );\n}");

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed end 3");
