const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

const target = `    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeDefault options:0 error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:&error];`;

const replacement = `    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeDefault options:0 error:&error];
    [[AVAudioSession sharedInstance] setPreferredSampleRate:192000.0 error:&error]; // 192kHz Hi-Res FLAC Support
    [[AVAudioSession sharedInstance] setActive:YES error:&error];`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
  console.log("Patched AVAudioSession for Hi-Res");
} else {
  console.log("AVAudioSession setup not found");
}
