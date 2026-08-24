const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldLyricsScroll = `<div className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none'`;
const newLyricsScroll = `<div onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none'`;
code = code.replace(oldLyricsScroll, newLyricsScroll);

const oldQueueScroll = `<div className="flex-1 overflow-y-auto pb-20 space-y-4">`;
const newQueueScroll = `<div onTouchMove={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto pb-20 space-y-4">`;
code = code.replace(oldQueueScroll, newQueueScroll);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
