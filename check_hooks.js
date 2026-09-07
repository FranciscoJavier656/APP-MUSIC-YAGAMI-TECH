const fs = require('fs');
const glob = require('glob');

glob('src/**/*.tsx', (err, files) => {
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let insideComponent = false;
    let componentName = '';
    
    lines.forEach((line, i) => {
      // Just visually inspect them.
    });
  });
});
