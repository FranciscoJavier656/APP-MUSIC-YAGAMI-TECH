const fs = require('fs');

let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

// Imports
code = code.replace(
  "import { getImageSrc } from '../lib/image';",
  "import { getImageSrc } from '../lib/image';\nimport { useIntersectionObserver } from '../hooks/useIntersectionObserver';"
);

// State and observer
code = code.replace(
  "const [error, setError] = useState('');",
  "const [error, setError] = useState('');\n  const [loadingMore, setLoadingMore] = useState(false);\n  const [hasMore, setHasMore] = useState(true);\n  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });"
);

// Fetch effect fix for setHasMore
code = code.replace(
  "setPlaylist(data);",
  "setPlaylist(data);\n        setHasMore((data.tracks?.items?.length || 0) < data.tracks_count);"
);

// Handle loadMore
const loadMoreFn = `
  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !loadingMore) {
      loadMoreTracks();
    }
  }, [isIntersecting, hasMore, loading, loadingMore]);

  const loadMoreTracks = async () => {
    if (!playlist || !playlist.tracks || !playlist.tracks.items) return;
    const currentCount = playlist.tracks.items.length;
    if (currentCount >= playlist.tracks_count) {
      setHasMore(false);
      return;
    }
    setLoadingMore(true);
    try {
      const data = await getQobuzPlaylist(playlistId, 50, currentCount);
      const newItems = data.tracks?.items || [];
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setPlaylist((prev: any) => ({
          ...prev,
          tracks: {
            ...prev.tracks,
            items: [...prev.tracks.items, ...newItems]
          }
        }));
        if (currentCount + newItems.length >= playlist.tracks_count) {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };
`;

code = code.replace(
  "const handlePlay = (track: any) => {",
  `${loadMoreFn}\n  const handlePlay = (track: any) => {`
);

// Add targetRef at the end of the tracks list
code = code.replace(
  "          </div>\n        </div>\n      </div>",
  `          </div>\n          {hasMore && (\n            <div ref={targetRef} className="py-6 flex justify-center">\n              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />\n            </div>\n          )}\n        </div>\n      </div>`
);

fs.writeFileSync('src/components/PlaylistView.tsx', code);
