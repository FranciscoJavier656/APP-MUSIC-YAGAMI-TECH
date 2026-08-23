const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
code = code.replace(`      const data = await searchQobuz(query);\n        setResults(data);\n      }\n    } catch`, `      const data = await searchQobuz(query);\n      setResults(data);\n    } catch`);
fs.writeFileSync('src/components/SearchTab.tsx', code);
