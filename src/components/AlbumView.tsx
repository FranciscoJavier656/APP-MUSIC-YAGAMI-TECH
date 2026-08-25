import { getQobuzAlbum } from "../lib/qobuz";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, Play, Download, Loader2, Disc, Music } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { useSwipeBack } from '../lib/useSwipeBack';
import DownloadModal from './DownloadModal';
import { AnimatePresence, motion } from 'motion/react';

interface AlbumViewProps {
  albumId: string;
  onBack: () => void;
}

export default function AlbumView({ albumId, onBack }: AlbumViewProps) {
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);
  useSwipeBack(onBack);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      try {
        const data = await getQobuzAlbum(albumId);
        setAlbum(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load album');
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [albumId]);

  const handlePlay = (track: any) => {
    // Generate queue from all tracks in album
    const queue = album.tracks?.items?.map((t: any) => ({
      id: t.id.toString(),
      title: t.title,
      artist: t.performer?.name || album.artist?.name || 'Unknown Artist',
      image: album.image?.large || album.image?.small || '',
      hires: t.hires || album.hires || t.maximum_bit_depth > 16 || album.maximum_bit_depth > 16 || false,
      duration: t.duration || 0,
      bitDepth: t.maximum_bit_depth || album.maximum_bit_depth,
      samplingRate: t.maximum_sampling_rate || album.maximum_sampling_rate,
      albumTitle: album.title,
      releaseDate: album.release_date_original || album.release_date_stream,
      label: album.label?.name,
      composer: t.composer?.name,
      copyright: t.copyright || album.copyright
    })) || [];

    const trackToPlay = queue.find((t: any) => t.id === track.id.toString()) || queue[0];
    
    if (trackToPlay) {
      playTrack(trackToPlay, queue);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
        <p>Cargando álbum...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="p-8 pt-16">
        <button onClick={onBack} className="flex items-center text-[#007AFF] mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" /> Volver
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-8">
      <header className="sticky top-0 z-40 bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-8 pt-12 pb-4 flex items-center">
        <button onClick={onBack} className="flex items-center text-[#007AFF] text-lg font-medium">
          <ChevronLeft className="w-6 h-6 mr-1 -ml-2" />
        </button>
      </header>

      <div className="px-8 mt-4 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-48 md:w-64 flex-shrink-0 relative group rounded-xl overflow-hidden shadow-2xl">
          <img src={album.image?.large || album.image?.small} alt={album.title} className="w-full h-auto object-cover" />
          <button 
            onClick={() => setDownloadItem({item: album, type: 'album'})}
            className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur rounded-full p-3 shadow-lg text-[#007AFF] hover:scale-105 transition-transform"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-2">{album.title}</h1>
          <p className="text-xl text-[#007AFF] font-semibold mb-4">{album.artist?.name}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs font-bold tracking-widest bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md text-black/60 dark:text-white/60 uppercase">
              {new Date(album.release_date_original || album.release_date_stream).getFullYear()}
            </span>
            <span className="text-xs font-bold tracking-widest bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md text-black/60 dark:text-white/60 uppercase">
              {album.tracks_count} Pistas
            </span>
            {album.hires && (
              <span className="text-xs font-bold tracking-widest bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 px-2.5 py-1 rounded-md border border-yellow-500/30">
                HI-RES AUDIO
              </span>
            )}
          </div>
          
          <button 
            onClick={() => handlePlay(album.tracks?.items?.[0])}
            className="bg-[#007AFF] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-[#0056b3] transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" /> Reproducir
          </button>
        </div>
      </div>

      <div className="px-8 mt-12">
        <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Pistas</h2>
        <div className="space-y-2">
          {album.tracks?.items?.map((track: any, index: number) => (
            <div key={track.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
              <span className="w-6 text-right text-gray-400 font-medium text-sm">{track.track_number}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-base leading-tight truncate ${currentTrack?.id === track.id.toString() ? 'text-[#007AFF]' : 'text-black dark:text-white'}`}>
                  {track.title}
                </p>
                {track.performer?.name && track.performer.name !== album.artist?.name && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{track.performer.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setDownloadItem({item: {...track, album}, type: 'track'})}
                  className="p-2 text-gray-400 hover:text-[#007AFF] rounded-full transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handlePlay(track)} 
                  className="p-2 text-gray-400 hover:text-[#007AFF] rounded-full transition-colors"
                >
                  {currentTrack?.id === track.id.toString() && isPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
              </div>
            </div>
          ))}
        </div>
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
  );
}
