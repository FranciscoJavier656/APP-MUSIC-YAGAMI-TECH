const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// Ensure motion is imported
if (!code.includes('import { AnimatePresence, motion } from')) {
  code = code.replace("import { AnimatePresence } from 'motion/react';", "import { AnimatePresence, motion } from 'motion/react';");
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

code = code.replace(/if \(selectedAlbumId\) \{\n\s*return <AlbumView[^>]+>;\n\s*\}/g, "");

code = code.replace(/return \(\n\s*<div className="flex flex-col min-h-full">/g, 
  'return (\n    <div className="h-full relative">\n' + viewsCode + '      <div className="flex flex-col min-h-full">'
);

// find last </div>\n  );\n} and insert one more closing div if needed, actually we just wrapped the whole return in <div className="h-full relative">
code = code.replace(/<\/div>\n\s*<\/div>\n\s*\);\n\}/, '      </div>\n    </div>\n    </div>\n  );\n}');

fs.writeFileSync('src/components/SearchTab.tsx', code);
