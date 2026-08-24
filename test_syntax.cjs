const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const Parser = acorn.Parser.extend(jsx());
try {
  Parser.parse(fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8'), { sourceType: 'module', plugins: { jsx: true } });
  console.log("Syntax is OK");
} catch (e) {
  console.error("Syntax Error: " + e.message + " at line " + e.loc.line + " column " + e.loc.column);
}
