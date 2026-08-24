const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

const oldUpdateState = `- (void)updateNowPlayingState {
    NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
    if (!info) return;`;

const newUpdateState = `- (void)updateNowPlayingState {
    NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
    if (!info) info = [NSMutableDictionary dictionary];`;

code = code.replace(oldUpdateState, newUpdateState);
fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
