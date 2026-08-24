const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Import motion/AnimatePresence
if (!code.includes("import { motion, AnimatePresence }")) {
    code = code.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");
}

// Replace the return block

const oldReturn = `  if (isAppLoading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#F2F2F7] dark:bg-[#000000] items-center justify-center transition-colors duration-300">
        <YagamiLoader />
      </div>
    );
  }

  return (
    <PlayerProvider>
      <div className="flex flex-col h-screen bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans sm:pb-0 overflow-hidden transition-colors duration-300">`;

const newReturn = `  return (
    <PlayerProvider>
      <AnimatePresence mode="wait">
        {isAppLoading ? (
          <motion.div 
            key="loader"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col h-screen w-screen bg-[#F2F2F7] dark:bg-[#000000] items-center justify-center transition-colors duration-300 absolute inset-0 z-[100]"
          >
            <YagamiLoader />
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="flex flex-col h-screen w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans sm:pb-0 overflow-hidden transition-colors duration-300 relative"
          >`;

code = code.replace(oldReturn, newReturn);

// Also we need to close the tags at the end
const oldEnd = `      </div>
    </PlayerProvider>
  );
}`;

const newEnd = `          </motion.div>
        )}
      </AnimatePresence>
    </PlayerProvider>
  );
}`;

code = code.replace(oldEnd, newEnd);

fs.writeFileSync('src/App.tsx', code);
