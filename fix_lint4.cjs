const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(/class ErrorBoundary extends React\.Component/g, 'class ErrorBoundary extends React.Component<any, any>');
fs.writeFileSync('src/App.tsx', appTsx);
