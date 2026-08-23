const fs = require('fs');

const original = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

// I will just fetch the file again from git if I messed it up too much.
