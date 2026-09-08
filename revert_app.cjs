const fs = require('fs');

// We see error TS2339 in App.tsx (hasError). I need to check what causes it.
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will remove the React.Component<any, any> change as it might have broken something else if the syntax was wrong. Let's fix the class properly.
code = code.replace(/class ErrorBoundary extends React\.Component\<any, any\>/g, 'class ErrorBoundary extends React.Component<any, any>');

fs.writeFileSync('src/App.tsx', code);
