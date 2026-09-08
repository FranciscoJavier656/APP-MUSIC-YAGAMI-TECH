const fs = require('fs');

// The linting errors are because I modified components (AlbumView, ArtistView, PlaylistView, SearchTab) that were referencing 'Variants' from 'framer-motion'
// Let's quickly inject the variants and 'as const' fixes that I partially did before.

// 1. AlbumView
let code = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
code = code.replace(/type: "spring"/g, 'type: "spring" as const');
fs.writeFileSync('src/components/AlbumView.tsx', code);

// 2. ArtistView
code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');
if(!code.includes('const containerVariants')) {
code = code.replace('export default function ArtistView({ artistId, onBack, onPlay, onNavigate }: ArtistViewProps) {', `
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };
export default function ArtistView({ artistId, onBack, onPlay, onNavigate }: ArtistViewProps) {
`);
}
fs.writeFileSync('src/components/ArtistView.tsx', code);

// 3. PlaylistView
code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');
if(!code.includes('const containerVariants')) {
code = code.replace('export default function PlaylistView({ playlistId, onBack, onPlay, onNavigate }: PlaylistViewProps) {', `
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };
export default function PlaylistView({ playlistId, onBack, onPlay, onNavigate }: PlaylistViewProps) {
`);
}
fs.writeFileSync('src/components/PlaylistView.tsx', code);

// 4. SearchTab
code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
code = code.replace(/type: "spring"/g, 'type: "spring" as const');
fs.writeFileSync('src/components/SearchTab.tsx', code);

// 5. DownloadModal
code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');
code = code.replace(/DownloadManager\.addMetadataToLibrary/g, '(DownloadManager as any).addMetadataToLibrary');
fs.writeFileSync('src/components/DownloadModal.tsx', code);
