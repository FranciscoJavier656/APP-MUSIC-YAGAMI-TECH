const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Ensure we have activeItem tracking for navigation
if (!code.includes('const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);')) {
  code = code.replace(
    'export default function HomeTab() {',
    "import AlbumView from './AlbumView';\nimport PlaylistView from './PlaylistView';\nexport default function HomeTab() {\n  const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);"
  );
  
  // Replace the main return to include views
  const oldReturn = 'return (\n    <div className="flex flex-col gap-8 pb-24">';
  const newReturn = `return (
    <>
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
      <div className="flex flex-col gap-8 pb-24">`;
  
  code = code.replace(oldReturn, newReturn);
  
  // Update playlist onClick handlers
  code = code.replace(/<div\s+key=\{playlist\.id\}\s+className="[^"]+"\s+onClick=\{\(\)\s*=>\s*console\.log\([^)]+\)\}/g, 
    (match) => match.replace(/onClick=\{\(\)\s*=>\s*console\.log\([^)]+\)\}/, "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}"));
  
  // Add closing tag for fragment
  code = code.replace(/<\/div>\n  \);\n\}/, '</div>\n    </>\n  );\n}');
  
  fs.writeFileSync('src/components/HomeTab.tsx', code);
}
