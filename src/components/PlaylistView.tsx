import { getQobuzPlaylist } from "../lib/qobuz";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, Play, Download, Loader2, Music, Shuffle } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { useSwipeBack } from '../lib/useSwipeBack';
import DownloadModal from './DownloadModal';
import { AnimatePresence, motion } from 'motion/react';

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistView({ playlistId, onBack }: PlaylistViewProps) {
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [downloadItem, setDownloadItem] = useState<{item: any, type: 'playlist'|'track'} | null>(null);
  useSwipeBack(onBack);

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const data = await getQobuzPlaylist(playlistId);
        setPlaylist(data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [playlistId]);

  const handlePlay = (track: any) => {
    // Generate queue from all tracks in playlist
    const queue = playlist.tracks?.items?.map((t: any) => ({
      id: t.id.toString(),
      title: t.title,
      artist: t.performer?.name || t.artist?.name || 'Unknown Artist',
      image: t.album?.image?.large || t.album?.image?.small || '',
      hires: t.hires || t.maximum_bit_depth > 16 || false,
      duration: t.duration || 0,
      bitDepth: t.maximum_bit_depth,
      samplingRate: t.maximum_sampling_rate,
      albumTitle: t.album?.title,
      releaseDate: t.release_date_original || t.release_date_stream,
      composer: t.composer?.name,
      copyright: t.copyright
    })) || [];

    const trackToPlay = track ? (queue.find((t: any) => t.id === track.id.toString()) || queue[0]) : queue[0];
    
    if (trackToPlay) {
      playTrack(trackToPlay, queue);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
        <p>Cargando playlist...</p>
      </div>
    );
  }

  if (error || !playlist) {
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

  // Calculate playlist total duration
  const totalDuration = playlist.duration || playlist.tracks?.items?.reduce((acc: number, t: any) => acc + (t.duration || 0), 0) || 0;
  const hours = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);

  // Generate image
  const coverImage = playlist.images300 && playlist.images300.length > 0 
    ? playlist.images300[0] 
    : (playlist.image?.large || playlist.image?.root || playlist.image_rectangle?.[0] || '');

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white pb-24 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-md px-4 py-3 pt-14 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-transparent">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 pt-4 pb-8">
        {/* Album/Playlist Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-xl shadow-2xl overflow-hidden mb-6 bg-gray-200 dark:bg-gray-800">
             {playlist.images300 && playlist.images300.length === 4 ? (
               <div className="grid grid-cols-2 w-full h-full">
                 <img src={playlist.images300[0]} alt={playlist.name} className="w-full h-full object-cover" />
                 <img src={playlist.images300[1]} alt={playlist.name} className="w-full h-full object-cover" />
                 <img src={playlist.images300[2]} alt={playlist.name} className="w-full h-full object-cover" />
                 <img src={playlist.images300[3]} alt={playlist.name} className="w-full h-full object-cover" />
               </div>
             ) : (
               <img src={coverImage} alt={playlist.name} className="w-full h-full object-cover" />
             )}
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight mb-2 leading-tight">{playlist.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-[15px] font-medium mb-1">
            {playlist.owner?.name || "Qobuz"}
          </p>
          <div className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">
            Playlist • {playlist.tracks_count || playlist.tracks?.items?.length || 0} canciones
            {totalDuration > 0 && `, ${hours > 0 ? `${hours} h ` : ''}${mins} min`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => handlePlay(null)}
            className="flex-1 max-w-[160px] bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-black/10 dark:shadow-white/10 hover:scale-105 transition-transform"
          >
            <Play className="fill-current w-5 h-5" /> Reproducir
          </button>
          
          <button 
            className="flex-1 max-w-[160px] bg-gray-200 dark:bg-gray-800 text-black dark:text-white py-3 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Shuffle className="w-5 h-5" /> Aleatorio
          </button>
        </div>

        {playlist.description && (
          <div className="mb-8 px-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3" dangerouslySetInnerHTML={{ __html: playlist.description }}></div>
        )}

        {/* Tracklist */}
        <div className="space-y-1 bg-white dark:bg-[#1C1C1E] p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
          {playlist.tracks?.items?.map((track: any, index: number) => {
            const isTrackPlaying = currentTrack?.id === track.id.toString();
            
            return (
              <div 
                key={track.id + index.toString()} 
                className={`flex items-center p-3 rounded-xl transition-colors cursor-pointer group ${
                  isTrackPlaying 
                    ? 'bg-[#007AFF]/10 dark:bg-[#007AFF]/20' 
                    : 'hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
                }`}
                onClick={() => handlePlay(track)}
              >
                <div className="w-8 flex justify-center text-[14px] font-medium text-gray-400 dark:text-gray-500">
                  {isTrackPlaying ? (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.5 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="w-4 h-4 text-[#007AFF]"
                     >
                       <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                     </motion.div>
                  ) : (
                    <span className="group-hover:hidden">{index + 1}</span>
                  )}
                  {!isTrackPlaying && <Play className="w-4 h-4 hidden group-hover:block fill-black dark:fill-white text-black dark:text-white" />}
                </div>

                <div className="flex-1 min-w-0 pr-4 pl-2">
                  <h3 className={`text-[15px] font-medium line-clamp-1 ${isTrackPlaying ? 'text-[#007AFF]' : 'text-black dark:text-white'}`}>
                    {track.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(track.hires || track.maximum_bit_depth > 16) && (
                      <span className="bg-[#FFB800] text-black text-[8px] font-black px-1 py-0.5 rounded uppercase leading-none">
                        Hi-Res
                      </span>
                    )}
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">
                      {track.performer?.name || track.artist?.name || playlist.owner?.name}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDownloadItem({ item: track, type: 'track' });
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {downloadItem && (
          <DownloadModal 
            
            onClose={() => setDownloadItem(null)}
            item={downloadItem.item}
            type={downloadItem.type}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
