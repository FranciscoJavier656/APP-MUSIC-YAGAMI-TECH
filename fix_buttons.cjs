const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(/<button className=""/g, '<button');

// also check for any div with duplicate classnames
code = code.replace(/<div className=""/g, '<div');

// Fix the dependency array in useEffect I noticed earlier
code = code.replace(/}, \[audioRef, isExpanded, analyser, isScrubbing, isExpanded\]\);/g, '}, [audioRef, analyser, isExpanded]);');

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed duplicates");
