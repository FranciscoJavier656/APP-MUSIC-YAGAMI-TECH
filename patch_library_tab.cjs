const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

code = code.replace(
  `  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);`,
  `  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [offlineAlbums, setOfflineAlbums] = useState<any[]>([]);
  const [offlineArtists, setOfflineArtists] = useState<any[]>([]);`
);

const loadLibraryCode = `  const loadOfflineLibrary = () => {
    try {
      // Tracks (favorites)
      const tracksStr = localStorage.getItem('offline_library_tracks');
      if (tracksStr) {
        const tracksObj = JSON.parse(tracksStr);
        const tracks = Object.values(tracksObj).sort((a: any, b: any) => {
          return (b.downloadedAt || 0) - (a.downloadedAt || 0);
        });
        setOfflineTracks(tracks);
      } else {
        // Fallback backward compatibility
        const oldStr = localStorage.getItem('offline_tracks');
        if (oldStr) {
           const oldObj = JSON.parse(oldStr);
           setOfflineTracks(Object.values(oldObj));
        } else {
           setOfflineTracks([]);
        }
      }

      // Albums
      const albumsStr = localStorage.getItem('offline_library_albums');
      if (albumsStr) {
        setOfflineAlbums(Object.values(JSON.parse(albumsStr)));
      } else {
        setOfflineAlbums([]);
      }

      // Artists
      const artistsStr = localStorage.getItem('offline_library_artists');
      if (artistsStr) {
        setOfflineArtists(Object.values(JSON.parse(artistsStr)));
      } else {
        setOfflineArtists([]);
      }

    } catch (e) {
      console.error("Error loading offline library:", e);
    } finally {
      setIsLoading(false);
    }
  };`;

// replace the entire loadOfflineLibrary function
code = code.replace(
  /  const loadOfflineLibrary = \(\) => \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};/,
  loadLibraryCode
);

const itemsMemoCode = `  // Process data for the views
  const items = useMemo(() => {
    if (activeTab === 'favorites') {
      return offlineTracks.map(track => {
        if (track.type === 'track') return track; // Ya viene formateado
        // Fallback viejo formato
        return {
          id: track.id,
          title: track.title,
          subtitle: track.artist?.name || track.performer?.name,
          image: track.album?.image?.small || track.image?.small || track.image,
          type: 'track',
          original: track
        };
      });
    }
    if (activeTab === 'albums') {
      return offlineAlbums;
    }
    if (activeTab === 'artists') {
      return offlineArtists;
    }
    return [];
  }, [offlineTracks, offlineAlbums, offlineArtists, activeTab]);`;

code = code.replace(
  /  \/\/ Process data for the views\n  const items = useMemo\(\(\) => \{[\s\S]*?\}, \[offlineTracks, activeTab\]\);/,
  itemsMemoCode
);

fs.writeFileSync('src/components/LibraryTab.tsx', code);
console.log('Patched LibraryTab.tsx');
