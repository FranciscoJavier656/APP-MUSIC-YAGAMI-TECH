const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Convert isScrubbing state to also have a ref
code = code.replace(
  `const [isScrubbing, setIsScrubbing] = useState(false);`,
  `const [isScrubbing, _setIsScrubbing] = useState(false);\n  const isScrubbingRef = useRef(false);\n  const setIsScrubbing = (val: boolean) => {\n    isScrubbingRef.current = val;\n    _setIsScrubbing(val);\n  };`
);

// 2. In the draw function, read from isScrubbingRef.current instead of isScrubbing
code = code.replace(
  `if (progressRef.current && !isScrubbing) {`,
  `if (progressRef.current && !isScrubbingRef.current) {`
);

// 3. Remove isScrubbing from useEffect dependencies
code = code.replace(
  `}, [audioRef, analyser, isScrubbing, isExpanded]);`,
  `}, [audioRef, analyser, isExpanded]);`
);

// 4. Also fix seekInputRef update which I missed in my previous patch
// Ah, the previous patch was:
// if (!isScrubbing) {
//   if (progressRef.current) progressRef.current.style.width = ...
//   if (seekInputRef.current) seekInputRef.current.value = ...
// }
// Let's replace whatever is there to use isScrubbingRef.current
code = code.replace(
  `if (!isScrubbing) {`,
  `if (!isScrubbingRef.current) {`
);


fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Fixed effect dependencies");
