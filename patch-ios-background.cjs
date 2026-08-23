const fs = require('fs');
let plist = fs.readFileSync('ios/App/App/Info.plist', 'utf8');

if (!plist.includes('<key>UIBackgroundModes</key>')) {
  const insertIndex = plist.indexOf('</dict>');
  const insertContent = `\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>audio</string>\n\t</array>\n`;
  plist = plist.slice(0, insertIndex) + insertContent + plist.slice(insertIndex);
  fs.writeFileSync('ios/App/App/Info.plist', plist);
  console.log('Added UIBackgroundModes to Info.plist');
} else {
  console.log('UIBackgroundModes already exists');
}
