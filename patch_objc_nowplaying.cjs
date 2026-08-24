const fs = require('fs');

let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

// Also trigger MPRemoteCommandCenter setup when we play something for the first time
// and make sure we don't overwrite the category with wrong options.
const oldSession = `    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:&error];`;

const newSession = `    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeDefault options:0 error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:&error];
    [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];`;

code = code.replace(oldSession, newSession);

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
