const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const errorPart = `<div className="flex items-center gap-3 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setDownloadItem({item: currentTrack, type: 'track'}); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setContextMenuTrack(currentTrack); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">`;

const fixPart = `<div className="flex items-center gap-3 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setDownloadItem({item: currentTrack, type: 'track'}); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setContextMenuTrack(currentTrack); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
            
          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">`;

code = code.replace(errorPart, fixPart);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
