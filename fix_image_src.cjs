const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // TrackContextMenu
  if (filePath.includes('TrackContextMenu')) {
    code = code.replace(
      `<img src={track.album?.image?.small || track.image?.small || track.image} alt={track.title} className="w-full h-full object-cover" />`,
      `{(() => {
                const src = track.album?.image?.small || track.album?.image?.large || track.image?.small || track.image?.large || (typeof track.image === 'string' ? track.image : '');
                return src ? <img src={src} alt={track.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-800"><Music /></div>;
              })()}`
    );
  }
  
  // DownloadModal
  if (filePath.includes('DownloadModal')) {
    code = code.replace(
      `{(item.image?.small || item.album?.image?.small || item.image?.thumbnail) ? (
                  <img src={item.image?.small || item.album?.image?.small || item.image?.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (`,
      `{(() => {
                const src = item.album?.image?.small || item.album?.image?.large || item.image?.small || item.image?.large || item.image?.thumbnail || (typeof item.image === 'string' ? item.image : '');
                return src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (
                `
    );
  }
  
  fs.writeFileSync(filePath, code);
}

fixFile('src/components/TrackContextMenu.tsx');
fixFile('src/components/DownloadModal.tsx');
