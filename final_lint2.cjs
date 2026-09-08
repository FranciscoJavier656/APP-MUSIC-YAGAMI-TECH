const fs = require('fs');

// We see error TS2561 in ExpandedPlayer.tsx: 'webkitBackgroundClip' does not exist in type 'Properties<string | number, string & {}>'. Did you mean to write 'WebkitBackgroundClip'?
// So in the `style={{}}` object of a Framer Motion or React component, the correct prop is actually `WebkitBackgroundClip` (capital W).
// I will fix it exactly there.

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
code = code.replace(/webkitBackgroundClip/g, 'WebkitBackgroundClip');
code = code.replace(/webkitTextFillColor/g, 'WebkitTextFillColor');
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);

// App.tsx ErrorBoundary
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/this\.props\.hasError/g, '(this.state as any).hasError');
appCode = appCode.replace(/this\.props\.error/g, '(this.state as any).error');
appCode = appCode.replace(/class ErrorBoundary extends React\.Component/g, 'class ErrorBoundary extends React.Component<any, any>');
fs.writeFileSync('src/App.tsx', appCode);

