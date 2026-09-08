const fs = require('fs');

// Fix 1: App.tsx types
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(/error: null/g, 'error: null as string | null');
appTsx = appTsx.replace(/hasError: false/g, 'hasError: false as boolean');
appTsx = appTsx.replace(/children/g, '(this.props as any).children');
appTsx = appTsx.replace(/window\.initializeTabBar/g, '(window as any).initializeTabBar');
appTsx = appTsx.replace(/window\.updateTab/g, '(window as any).updateTab');
appTsx = appTsx.replace(/App\.addListener/g, '(App as any).addListener');
fs.writeFileSync('src/App.tsx', appTsx);

// Fix 2: ExpandedPlayer.tsx (WebkitBackgroundClip inside motion component style)
let epTsx = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
epTsx = epTsx.replace(/webkitBackgroundClip/g, "WebkitBackgroundClip"); // Revert back for style object
epTsx = epTsx.replace(/webkitTextFillColor/g, "WebkitTextFillColor");
fs.writeFileSync('src/components/ExpandedPlayer.tsx', epTsx);

