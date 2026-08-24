const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldReturn = `  return (
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
          >
                {/* Main Content Area */}`;

const newReturn = `  return (
    <PlayerProvider>
      <div className="flex flex-col h-screen w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans sm:pb-0 overflow-hidden transition-colors duration-300 relative">
        <AnimatePresence>
          {isAppLoading && (
            <motion.div 
              key="loader"
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="flex flex-col h-screen w-screen bg-[#F2F2F7] dark:bg-[#000000] items-center justify-center absolute inset-0 z-[100]"
            >
              <YagamiLoader />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}`;

code = code.replace(oldReturn, newReturn);

const oldEnd = `          </motion.div>
        )}
      </AnimatePresence>
    </PlayerProvider>
  );
}`;

const newEnd = `      </div>
    </PlayerProvider>
  );
}`;

code = code.replace(oldEnd, newEnd);

fs.writeFileSync('src/App.tsx', code);
