const fs = require('fs');

// Fix 1: App.tsx
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(/setActiveTab=\{setActiveTab\}/g, "setActiveTab={(id: string) => setActiveTab(id as any)}");
fs.writeFileSync('src/App.tsx', appTsx);

// Fix 2: ExpandedPlayer.tsx (Webkit properties)
let epTsx = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
epTsx = epTsx.replace(/WebkitBackgroundClip/g, "webkitBackgroundClip");
epTsx = epTsx.replace(/WebkitTextFillColor/g, "webkitTextFillColor");
epTsx = epTsx.replace(/YagamiNative\.getVibrantColor/g, "(YagamiNative as any).getVibrantColor");
fs.writeFileSync('src/components/ExpandedPlayer.tsx', epTsx);

// Fix 3: AlbumView.tsx
let albumTsx = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
albumTsx = albumTsx.replace(/type: "spring"/g, 'type: "spring" as const');
fs.writeFileSync('src/components/AlbumView.tsx', albumTsx);

// Fix 4: ArtistView.tsx
let artistTsx = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');
const cvDef = `const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};`;
if(!artistTsx.includes('const containerVariants')) {
    artistTsx = artistTsx.replace('export default function ArtistView({ artistId, onBack, onPlay, onNavigate }: ArtistViewProps) {', `export default function ArtistView({ artistId, onBack, onPlay, onNavigate }: ArtistViewProps) {\n  ${cvDef}`);
}
fs.writeFileSync('src/components/ArtistView.tsx', artistTsx);

// Fix 5: DownloadModal.tsx
let dmTsx = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');
dmTsx = dmTsx.replace(/DownloadManager\.addMetadataToLibrary/g, "(DownloadManager as any).addMetadataToLibrary");
fs.writeFileSync('src/components/DownloadModal.tsx', dmTsx);

// Fix 6: PlaylistView.tsx
let plTsx = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');
if(!plTsx.includes('const containerVariants')) {
    plTsx = plTsx.replace('export default function PlaylistView({ playlistId, onBack, onPlay, onNavigate }: PlaylistViewProps) {', `export default function PlaylistView({ playlistId, onBack, onPlay, onNavigate }: PlaylistViewProps) {\n  ${cvDef}`);
}
fs.writeFileSync('src/components/PlaylistView.tsx', plTsx);

// Fix 7: SearchTab.tsx
let searchTsx = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
searchTsx = searchTsx.replace(/type: "spring"/g, 'type: "spring" as const');
fs.writeFileSync('src/components/SearchTab.tsx', searchTsx);

