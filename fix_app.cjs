const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix ErrorBoundary mismatch
code = code.replace(
`        </ErrorBoundary>

        
        </ErrorBoundary>`,
`        </ErrorBoundary>`
);

// Add MiniPlayer back
code = code.replace(
`        <AnimatePresence>
          {globalOverlay && globalOverlay.type === 'album' && (`,
`        <MiniPlayer />
        <AnimatePresence>
          {globalOverlay && globalOverlay.type === 'album' && (`
);

fs.writeFileSync('src/App.tsx', code);
