import { searchQobuz } from "../lib/qobuz";
import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Search as SearchIcon, Download, Disc, Music, Loader2, Play } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import DownloadModal from './DownloadModal';
import AlbumView from './AlbumView';
import { AnimatePresence, motion } from 'motion/react';

interface QobuzItem {
  id: string;
  title: string;
  artist?: { name: string };
  performer?: { name: string };
  composer?: { name: string };
  copyright?: string;
  release_date_original?: string;
  maximum_sampling_rate?: number;
  image?: { large?: string; small?: string; thumbnail?: string };
  album?: { 
    title?: string;
    image?: { large?: string; small?: string; thumbnail?: string };
    hires?: boolean;
    duration?: number;
    maximum_bit_depth?: number;
    maximum_sampling_rate?: number;
    release_date_original?: string;
    release_date_stream?: string;
    label?: { name: string };
    copyright?: string;
  };
  duration?: number;
  hires?: boolean;
  maximum_bit_depth?: number;
}

interface SearchResults {
  albums?: { items: QobuzItem[] };
  tracks?: { items: QobuzItem[] };
  artists?: { items: QobuzItem[] };
}

import PlaylistView from './PlaylistView';
export default function SearchTab() {
  const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState('');
  const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await searchQobuz(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: QobuzItem) => {
    if (currentTrack?.id === track.id.toString()) {
      togglePlay();
    } else {
      const queue = results?.tracks?.items?.map(t => ({
        id: t.id.toString(),
        title: t.title,
        artist: t.artist?.name || t.performer?.name || 'Unknown Artist',
        image: t.image?.large || t.album?.image?.large || t.image?.small || t.album?.image?.small || '',
        hires: t.hires || t.album?.hires || t.maximum_bit_depth > 16 || t.album?.maximum_bit_depth > 16 || false,
        duration: t.duration || t.album?.duration || 0,
        bitDepth: t.maximum_bit_depth || t.album?.maximum_bit_depth,
        samplingRate: t.maximum_sampling_rate || t.album?.maximum_sampling_rate,
        albumTitle: t.album?.title,
        releaseDate: t.album?.release_date_original || t.album?.release_date_stream || t.release_date_original,
        label: t.album?.label?.name,
        composer: t.composer?.name,
        copyright: t.copyright || t.album?.copyright
      })) || [];

      playTrack({
        id: track.id.toString(),
        title: track.title,
        artist: track.artist?.name || track.performer?.name || 'Unknown Artist',
        image: track.image?.large || track.album?.image?.large || track.image?.small || track.album?.image?.small || '',
        hires: track.hires || track.album?.hires || track.maximum_bit_depth > 16 || track.album?.maximum_bit_depth > 16 || false,
        duration: track.duration || track.album?.duration || 0,
        bitDepth: track.maximum_bit_depth || track.album?.maximum_bit_depth,
        samplingRate: track.maximum_sampling_rate || track.album?.maximum_sampling_rate,
        albumTitle: track.album?.title,
        releaseDate: track.album?.release_date_original || track.album?.release_date_stream || track.release_date_original,
        label: track.album?.label?.name,
        composer: track.composer?.name,
        copyright: track.copyright || track.album?.copyright
      }, queue);
    }
  };

  if (selectedAlbumId) {
    return <AlbumView albumId={selectedAlbumId} onBack={() => setActiveItem(null)} />;
  }

  return (
    <div className="h-full relative">

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
      <div className="flex flex-col min-h-full">
      {/* iOS style sticky header with blur */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-8 pt-12 pb-4">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">Buscar</h1>
          <span className="text-[#007AFF] text-lg font-medium cursor-pointer">Editar</span>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-[#E3E3E8] dark:bg-[#1C1C1E] border-none rounded-xl text-md text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none"
            placeholder="Buscar en tu música"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </header>

      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
            <p>Buscando en Qobuz...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50">
            <p className="font-semibold mb-1">Search Failed</p>
            <p>{error}</p>
            <p className="mt-2 text-xs opacity-80">Make sure QOBUZ_APP_ID is configured in settings.</p>
          </div>
        ) : results ? (
          <div className="space-y-8">
            {results.albums?.items && results.albums.items.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center text-black dark:text-white"><Disc className="w-5 h-5 mr-2 text-[#007AFF]" /> Albums</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
                  {results.albums.items.slice(0, 4).map((album) => (
                    <div key={album.id} onClick={() => setSelectedAlbumId(album.id.toString())} className="flex flex-col gap-2 group cursor-pointer">
                      <div className="aspect-square rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800 relative">
                        {album.image?.large ? (
                          <img src={album.image.large} alt={album.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Disc className="w-8 h-8" /></div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDownloadItem({item: album, type: 'album'}) }}
                          className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-[#007AFF]"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-1">
                        <p className="font-semibold text-lg leading-tight truncate text-black dark:text-white">{album.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{album.artist?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.tracks?.items && results.tracks.items.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center text-black dark:text-white"><Music className="w-5 h-5 mr-2 text-[#007AFF]" /> Top Tracks</h2>
                <div className="space-y-3">
                  {results.tracks.items.slice(0, 5).map((track: any) => (
                    <div key={track.id} className="flex items-center space-x-3 bg-white dark:bg-[#1C1C1E] p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0 relative group">
                        {track.album?.image?.small || track.image?.small ? (
                          <img src={track.album?.image?.small || track.image?.small} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Music className="w-5 h-5" /></div>
                        )}
                        <button 
                          onClick={() => handlePlay(track)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-5 h-5 text-white fill-white" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg leading-tight truncate text-black dark:text-white">{track.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{track.artist?.name || track.performer?.name}</p>
                      </div>
                      <button 
                        onClick={() => setDownloadItem({item: track, type: 'track'})}
                        className="p-2 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors flex-shrink-0"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button onClick={() => handlePlay(track)} className="p-2 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors flex-shrink-0">
                        {currentTrack?.id === track.id.toString() && isPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
            <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>Busca tu música favorita en alta resolución</p>
          </div>
        )}
      </div>

            <AnimatePresence>
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item} 
            type={downloadItem.type} 
            onClose={() => setDownloadItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
