const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

code = code.replace(
  "import { getImageSrc } from '../lib/image';",
  "import { getImageSrc } from '../lib/image';\nimport { useIntersectionObserver } from '../hooks/useIntersectionObserver';"
);

code = code.replace(
  "const [error, setError] = useState('');",
  "const [error, setError] = useState('');\n  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);\n  const [hasMoreTracks, setHasMoreTracks] = useState(true);\n  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });"
);

code = code.replace(
  "setArtist(data);",
  "setArtist(data);\n        setHasMoreTracks((data.tracks?.items?.length || 0) < (data.tracks?.total || 100)); // Default fallback for total"
);

const loadMoreFn = `
  useEffect(() => {
    if (isIntersecting && hasMoreTracks && !loading && !loadingMoreTracks && artist) {
      loadMoreTracks();
    }
  }, [isIntersecting, hasMoreTracks, loading, loadingMoreTracks, artist]);

  const loadMoreTracks = async () => {
    if (!artist || !artist.tracks || !artist.tracks.items) return;
    const currentCount = artist.tracks.items.length;
    const total = artist.tracks.total || 9999;
    if (currentCount >= total) {
      setHasMoreTracks(false);
      return;
    }
    setLoadingMoreTracks(true);
    try {
      const data = await getQobuzArtist(artistId, 50, currentCount);
      const newItems = data.tracks?.items || [];
      if (newItems.length === 0) {
        setHasMoreTracks(false);
      } else {
        setArtist((prev: any) => ({
          ...prev,
          tracks: {
            ...prev.tracks,
            items: [...prev.tracks.items, ...newItems]
          }
        }));
        if (currentCount + newItems.length >= total) {
          setHasMoreTracks(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMoreTracks(false);
    }
  };
`;

code = code.replace(
  "const handlePlay = (track: any) => {",
  `${loadMoreFn}\n  const handlePlay = (track: any) => {`
);

// We need to add the targetRef at the end of the topTracks list
code = code.replace(
  "              </div>\n            ))}\n          </div>\n        </div>",
  "              </div>\n            ))}\n            {hasMoreTracks && (\n              <div ref={targetRef} className=\"py-6 flex justify-center\">\n                <Loader2 className=\"w-6 h-6 animate-spin text-gray-400\" />\n              </div>\n            )}\n          </div>\n        </div>"
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
