const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const importLines = `
import AlbumView from './components/AlbumView';
import PlaylistView from './components/PlaylistView';
import ArtistView from './components/ArtistView';
`;

code = code.replace("import DownloadsTab from './components/DownloadsTab';", "import DownloadsTab from './components/DownloadsTab';" + importLines);

const stateAndEffect = `
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);

  useEffect(() => {
    const handleGlobalOverlay = (e: any) => {
      setGlobalOverlay(e.detail);
    };
    document.addEventListener('open-overlay', handleGlobalOverlay);
    return () => document.removeEventListener('open-overlay', handleGlobalOverlay);
  }, []);
`;

code = code.replace("const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');", stateAndEffect);

const overlayJSX = `
        </ErrorBoundary>

        <AnimatePresence>
          {globalOverlay && globalOverlay.type === 'album' && (
            <motion.div 
              key="global-album"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <AlbumView albumId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
          {globalOverlay && globalOverlay.type === 'playlist' && (
            <motion.div 
              key="global-playlist"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <PlaylistView playlistId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
          {globalOverlay && globalOverlay.type === 'artist' && (
            <motion.div 
              key="global-artist"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <ArtistView artistId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Player */}
`;

code = code.replace("{/* Mini Player */}", overlayJSX);

fs.writeFileSync('src/App.tsx', code);
