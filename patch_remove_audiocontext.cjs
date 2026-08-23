const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// Remove AudioContext refs and state
code = code.replace(/  const audioContextRef = useRef<AudioContext \| null>\(null\);\n/g, '');
code = code.replace(/  const analyserRef = useRef<AnalyserNode \| null>\(null\);\n/g, '');
code = code.replace(/  const \[analyser, setAnalyser\] = useState<AnalyserNode \| null>\(null\);\n/g, '');

// Remove initAudioContext function
code = code.replace(/  const initAudioContext = \(\) => \{\n    if \(!audioContextRef\.current && audioRef\.current\) \{\n      const AudioContextClass = window\.AudioContext \|\| \(window as any\)\.webkitAudioContext;\n      if \(AudioContextClass\) \{\n        audioContextRef\.current = new AudioContextClass\(\);\n        const analyserNode = audioContextRef\.current\.createAnalyser\(\);\n        analyserNode\.fftSize = 256;\n        analyserNode\.smoothingTimeConstant = 0\.8;\n        \n        const source = audioContextRef\.current\.createMediaElementSource\(audioRef\.current\);\n        source\.connect\(analyserNode\);\n        analyserNode\.connect\(audioContextRef\.current\.destination\);\n        \n        analyserRef\.current = analyserNode;\n        setAnalyser\(analyserNode\);\n      \}\n    \}\n  \};\n/g, '');

// Remove init calls
code = code.replace(/    initAudioContext\(\);\n    if \(audioContextRef\.current && audioContextRef\.current\.state === 'suspended'\) \{\n      audioContextRef\.current\.resume\(\);\n    \}\n/g, '');

// Replace analyser in Provider with null, but let's just leave the type as is or change it.
// Actually, let's keep it in the type but provide null, to not break ExpandedPlayer if we miss something.
code = code.replace(/      analyser,\n        audioRef/g, '      analyser: null,\n        audioRef');

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Removed AudioContext from PlayerContext");
