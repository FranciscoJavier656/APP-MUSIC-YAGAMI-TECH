const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

const oldCode = `                            <button 
                              onClick={() => {
                                playTrack({ 
                                  ...item.track, 
                                  localPath: item.track.localPath 
                                });
                              }}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1DB954] group transition-colors"
                            >`;

const newCode = `                            <button 
                              onClick={() => {
                                const trackToPlay = { 
                                  ...item.track, 
                                  localPath: item.track.localPath 
                                };
                                const queueToPlay = downloads.filter((d: any) => d.status === 'completed' && d.track).map((d: any) => ({
                                  ...d.track,
                                  localPath: d.track.localPath
                                }));
                                playTrack(trackToPlay, queueToPlay);
                              }}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1DB954] group transition-colors"
                            >`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/components/DownloadsTab.tsx', code);
  console.log("DownloadsTab fixed");
} else {
  console.log("DownloadsTab block not found");
}
