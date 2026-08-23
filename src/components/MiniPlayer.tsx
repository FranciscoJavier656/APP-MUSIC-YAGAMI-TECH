import { usePlayer } from './PlayerContext';
import { Play, Pause, Loader2, SkipForward, SkipBack } from 'lucide-react';
import ExpandedPlayer from './ExpandedPlayer';
import { AnimatePresence, motion } from 'motion/react';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, isLoading, togglePlay, progress, isExpanded, setIsExpanded, nextTrack, prevTrack } = usePlayer();

  if (!currentTrack) return null;

  return (
    <>
      <div className="absolute bottom-[92px] left-2 right-2 z-40 overflow-hidden rounded-2xl">
        <motion.div 
          className="cursor-pointer touch-none"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80) {
              prevTrack();
            } else if (info.offset.x < -80) {
              nextTrack();
            }
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            setIsExpanded(true);
          }}
        >
          <div className="bg-[#F9F9F9]/95 dark:bg-[#2C2C2E]/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-2 flex items-center gap-3 relative">
            <div className="absolute bottom-0 left-0 h-[2px] bg-gray-200 dark:bg-gray-700 w-full">
              <div 
                className="h-full bg-[#007AFF] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="w-12 h-12 bg-black/10 rounded-lg overflow-hidden shadow-inner flex-shrink-0">
              {currentTrack.image ? (
                <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500">?</div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-[15px] font-semibold leading-tight truncate text-black dark:text-white">
                {currentTrack.title}
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight truncate">
                {currentTrack.artist}
              </p>
            </div>

            <div className="flex items-center gap-4 pr-2">
              <button onClick={togglePlay} className="p-2 -m-2 text-black dark:text-white hover:opacity-70 transition-opacity">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#007AFF]" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isExpanded && <ExpandedPlayer />}
      </AnimatePresence>
    </>
  );
}
