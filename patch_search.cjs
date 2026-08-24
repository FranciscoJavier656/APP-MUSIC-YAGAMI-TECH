const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// Ensure we have activeItem tracking for navigation
if (!code.includes('const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);')) {
  code = code.replace(
    'export default function SearchTab() {',
    "import PlaylistView from './PlaylistView';\nexport default function SearchTab() {\n  const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);"
  );
  
  // Replace the main return to include views
  const oldReturn = 'return (\n    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-[#000000]">';
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
      <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-[#000000]">`;
  
  code = code.replace(oldReturn, newReturn);
  
  // Replace activeItem={albumId} logic with our new activeItem object
  code = code.replace(/const \[activeAlbum, setActiveAlbum\] = useState<string \| null>\(null\);/g, '');
  code = code.replace(/setActiveAlbum\(/g, "setActiveItem(");
  code = code.replace(/activeAlbum/g, "activeItem");
  code = code.replace(/<AlbumView albumId=\{activeItem\}/g, "<AlbumView albumId={activeItem?.id}");
  code = code.replace(/onBack=\{([^}]+)\}/g, "onBack={() => setActiveItem(null)}");
  
  // Add closing tag for fragment
  code = code.replace(/<\/div>\n  \);\n\}/, '</div>\n    </>\n  );\n}');
  
  fs.writeFileSync('src/components/SearchTab.tsx', code);
}
