const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Remove motion imports
code = code.replace(/import \{ motion, AnimatePresence \} from 'motion\/react';\n/g, '');
code = code.replace(/import \{ AnimatePresence, motion \} from 'motion\/react';\n/g, '');
// just in case they are combined with other imports, replace just the words if they are standalone
code = code.replace(/import \{.*?motion.*?\} from 'motion\/react';\n/g, '');


// 2. Change root <motion.div to <div
// We need to find the return statement of ExpandedPlayer
code = code.replace(
  /<motion\.div\n      initial=\{\{ y: '100%', opacity: 0 \}\}\n      animate=\{\{ y: 0, opacity: 1 \}\}\n      exit=\{\{ y: '100%', opacity: 0 \}\}\n      transition=\{\{ type: 'spring', damping: 25, stiffness: 200 \}\}\n      className="fixed inset-0 z-\[60\] bg-white\/90 dark:bg-\[#1C1C1E\]\/90 backdrop-blur-md flex flex-col pt-12 pb-8 px-6 sm:px-12"/,
  `<div
      className={\`fixed inset-0 z-[60] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md flex flex-col pt-12 pb-8 px-6 sm:px-12 transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] \${isExpanded ? 'translate-y-0' : 'translate-y-full'}\`}`
);
code = code.replace(/<\/motion\.div>\n  \);/, `</div>\n  );`);

// Replace all other motion.div with div and motion.button with button
code = code.replace(/<motion\.button/g, '<button');
code = code.replace(/<\/motion\.button>/g, '</button>');
code = code.replace(/whileTap=\{\{ scale: 0\.[0-9]+ \}\}/g, 'active:scale-95 transition-transform');

// Modals: Queue and Credits
// These also had motion.div
code = code.replace(
  /<motion\.div\n            initial=\{\{ y: '100%' \}\}\n            animate=\{\{ y: 0 \}\}\n            exit=\{\{ y: '100%' \}\}\n            transition=\{\{ type: 'spring', damping: 25, stiffness: 200 \}\}\n            className="absolute inset-0 z-50 bg-white\/95 dark:bg-\[#1C1C1E\]\/95 backdrop-blur-md flex flex-col"/g,
  `<div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-full duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"`
);
// In case the above regex doesn't match perfectly, let's do a generic one for modals
code = code.replace(/<motion\.div\n\s*initial=\{[^}]+\}\n\s*animate=\{[^}]+\}\n\s*exit=\{[^}]+\}\n\s*transition=\{[^}]+\}\n\s*className="absolute/g, 
  `<div className="absolute animate-in slide-in-from-bottom-full duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`);

// Remove <AnimatePresence> wrappers
code = code.replace(/<AnimatePresence>/g, '');
code = code.replace(/<\/AnimatePresence>/g, '');

// Clean up remaining motion.div tags
code = code.replace(/<motion\.div/g, '<div');
code = code.replace(/<\/motion\.div>/g, '</div>');

// 3. Smart pause for canvas
const oldEffect = `useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // We create a dummy data array to keep variables simple if no analyser
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {`;

const newEffect = `useEffect(() => {
    let animationId: number;
    let timeoutId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const startDrawing = () => {
      const draw = () => {`;

const oldEffectEnd = `animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [audioRef, analyser, isScrubbing]);`;

const newEffectEnd = `animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    if (isExpanded) {
      timeoutId = window.setTimeout(startDrawing, 300);
    }

    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [audioRef, analyser, isScrubbing, isExpanded]);`;

code = code.replace(oldEffect, newEffect);
code = code.replace(oldEffectEnd, newEffectEnd);

// Fix indentation / brackets manually for the draw function if needed, but simple replace should work.
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Refactored ExpandedPlayer");
