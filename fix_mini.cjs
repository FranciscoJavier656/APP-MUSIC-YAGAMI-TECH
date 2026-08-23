const fs = require('fs');

let code = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');

// Remove AnimatePresence and conditional rendering of ExpandedPlayer
code = code.replace(/<AnimatePresence>\s*\{isExpanded && <ExpandedPlayer \/>\}\s*<\/AnimatePresence>/g, '<ExpandedPlayer />');
code = code.replace(/import \{ AnimatePresence, motion \} from 'motion\/react';/g, "import { motion } from 'motion/react';");

fs.writeFileSync('src/components/MiniPlayer.tsx', code);
console.log("Fixed MiniPlayer rendering");
