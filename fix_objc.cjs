const fs = require('fs');

let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

const remoteControlsCode = `
- (void)setupRemoteControls:(CAPPluginCall *)call {
    dispatch_async(dispatch_get_main_queue(), ^{
        MPRemoteCommandCenter *commandCenter = [MPRemoteCommandCenter sharedCommandCenter];
        
        [commandCenter.playCommand removeTarget:nil];
        [commandCenter.pauseCommand removeTarget:nil];
        [commandCenter.nextTrackCommand removeTarget:nil];
        [commandCenter.previousTrackCommand removeTarget:nil];
        [commandCenter.changePlaybackPositionCommand removeTarget:nil];
        
        [commandCenter.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            [self notifyListeners:@"onRemotePlay" data:@{}];
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            [self notifyListeners:@"onRemotePause" data:@{}];
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.nextTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            [self notifyListeners:@"onRemoteNext" data:@{}];
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.previousTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            [self notifyListeners:@"onRemotePrev" data:@{}];
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.changePlaybackPositionCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            MPChangePlaybackPositionCommandEvent *positionEvent = (MPChangePlaybackPositionCommandEvent *)event;
            [self notifyListeners:@"onRemoteSeek" data:@{@"time": @(positionEvent.positionTime)}];
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [call resolve];
    });
}

- (void)updateNowPlayingState {
    NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
    if (!info) return;
    
    if (self.player) {
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(CMTimeGetSeconds(self.player.currentTime));
        info[MPNowPlayingInfoPropertyPlaybackRate] = @(self.isPlaying ? 1.0 : 0.0);
    }
    
    [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
}

- (void)updateMetadata:(CAPPluginCall *)call {
    NSString *title = call.options[@"title"];
    NSString *artist = call.options[@"artist"];
    NSString *album = call.options[@"album"];
    NSString *coverUrl = call.options[@"coverUrl"];
    NSNumber *durationNum = call.options[@"duration"];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        NSMutableDictionary *nowPlayingInfo = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
        if (!nowPlayingInfo) nowPlayingInfo = [NSMutableDictionary dictionary];
        
        if (title) nowPlayingInfo[MPMediaItemPropertyTitle] = title;
        if (artist) nowPlayingInfo[MPMediaItemPropertyArtist] = artist;
        if (album) nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album;
        
        if (durationNum) {
            nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = durationNum;
        }
        
        if (self.player) {
            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(CMTimeGetSeconds(self.player.currentTime));
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = @(self.isPlaying ? 1.0 : 0.0);
        }
        
        [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = nowPlayingInfo;
        
        // Asynchronous image loading for cover
        if (coverUrl && [coverUrl isKindOfClass:[NSString class]] && coverUrl.length > 0) {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                NSURL *url = [NSURL URLWithString:coverUrl];
                if (url) {
                    NSData *data = [NSData dataWithContentsOfURL:url];
                    if (data) {
                        UIImage *image = [UIImage imageWithData:data];
                        if (image) {
                            MPMediaItemArtwork *artwork = [[MPMediaItemArtwork alloc] initWithBoundsSize:image.size requestHandler:^UIImage * _Nonnull(CGSize size) {
                                return image;
                            }];
                            dispatch_async(dispatch_get_main_queue(), ^{
                                NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
                                if (!info) return;
                                info[MPMediaItemPropertyArtwork] = artwork;
                                [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
                            });
                        }
                    }
                }
            });
        }
        
        [call resolve];
    });
}
`;

if (!code.includes('- (void)setupRemoteControls:(CAPPluginCall *)call')) {
    code = code.replace('@implementation QobuzAudioPlugin', '@implementation QobuzAudioPlugin\n' + remoteControlsCode);
}

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
