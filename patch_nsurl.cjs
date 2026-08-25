const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

const targetUrl = `    NSURL *url = [NSURL URLWithString:urlString];`;

const replacementUrl = `    NSURL *url;
    if ([urlString hasPrefix:@"file://"]) {
        url = [NSURL fileURLWithPath:[urlString substringFromIndex:7]];
    } else if ([urlString hasPrefix:@"/"]) {
        url = [NSURL fileURLWithPath:urlString];
    } else {
        url = [NSURL URLWithString:urlString];
    }`;

if (code.includes(targetUrl)) {
  code = code.replace(targetUrl, replacementUrl);
  fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
  console.log("Patched NSURL creation for file paths");
} else {
  console.log("Target NSURL not found");
}
