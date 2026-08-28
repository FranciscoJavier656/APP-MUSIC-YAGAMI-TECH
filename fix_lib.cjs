const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

const oldCode = `                        {(item.type === 'track' || activeTab === 'favorites') && (
                          <button 
                            onClick={() => {
                               playTrack({ 
                                 ...item.original, 
                                 localPath: item.original.localPath || item.localPath 
                               });
                            }}
                            className="overflow-hidden rounded-xl"
                          >`;

const newCode = `                        {(item.type === 'track' || activeTab === 'favorites') && (
                          <button 
                            onClick={() => {
                               const trackToPlay = { 
                                 ...item.original, 
                                 localPath: item.original.localPath || item.localPath 
                               };
                               const queueToPlay = (activeTab === 'favorites' ? offlineTracks : items.filter((i: any) => i.type === 'track' || i.original)).map((i: any) => ({
                                 ...(i.original || i),
                                 localPath: (i.original && i.original.localPath) || i.localPath
                               }));
                               playTrack(trackToPlay, queueToPlay);
                            }}
                            className="overflow-hidden rounded-xl"
                          >`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/components/LibraryTab.tsx', code);
  console.log("LibraryTab fixed");
} else {
  console.log("LibraryTab block not found");
}
