const fs = require('fs');
let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

code = code.replace(/\\`, \\\$\\{hours/g, '`, ${hours');
code = code.replace(/\\` : ''\\}\\$\\{mins/g, '` : \'\'}${mins');

fs.writeFileSync('src/components/PlaylistView.tsx', code);
