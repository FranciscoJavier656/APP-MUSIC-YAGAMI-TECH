const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace("\\`0\\$\\{globalIdx\\}\\`", "\`0\${globalIdx}\`");
code = code.replace("className={\\`absolute inset-0 bg-gradient-to-br \\$\\{cat.color\\} opacity-90\\`}", "className={\`absolute inset-0 bg-gradient-to-br \${cat.color} opacity-90\`}");
code = code.replace("className={\\`relative aspect-square mb-3 rounded-lg overflow-hidden \\$\\{karaoke.bg\\} flex items-center justify-center\\`}", "className={\`relative aspect-square mb-3 rounded-lg overflow-hidden \${karaoke.bg} flex items-center justify-center\`}");

fs.writeFileSync('src/components/HomeTab.tsx', code);
