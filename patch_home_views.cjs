const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Ensure imports exist
if (!code.includes('import { AnimatePresence, motion } from')) {
  code = code.replace("import AlbumView from './AlbumView';", "import AlbumView from './AlbumView';\nimport { AnimatePresence, motion } from 'motion/react';");
}

const viewsCode = `
      <AnimatePresence mode="wait">
        {activeItem?.type === 'album' && (
          <motion.div 
            key="album-view"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#F2F2F7] dark:bg-[#000000] overflow-y-auto"
          >
            <AlbumView albumId={activeItem.id} onBack={() => setActiveItem(null)} />
          </motion.div>
        )}
        {activeItem?.type === 'playlist' && (
          <motion.div 
            key="playlist-view"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#F2F2F7] dark:bg-[#000000] overflow-y-auto"
          >
            <PlaylistView playlistId={activeItem.id} onBack={() => setActiveItem(null)} />
          </motion.div>
        )}
      </AnimatePresence>
`;

// Insert after return (
code = code.replace(/return \(\n    <div className="h-full w-full bg-\[\#F2F2F7\] dark:bg-\[\#000000\] text-black dark:text-white transition-colors duration-300 overflow-y-auto pb-24">/, 
  'return (\n    <>\n' + viewsCode + '    <div className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white transition-colors duration-300 overflow-y-auto pb-24">'
);

// We need to make sure the root fragment is closed
const lastDivIndex = code.lastIndexOf('    </div>');
if (lastDivIndex > 0) {
   // Just replace the end properly
   code = code.replace(/\s+<\/div>\s*$/g, '\n    </div>\n    </>\n  );\n}\n');
}

fs.writeFileSync('src/components/HomeTab.tsx', code);
