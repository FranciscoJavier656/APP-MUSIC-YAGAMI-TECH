#import <AVFoundation/AVFoundation.h>
void test(AVAsset *asset) {
    [asset loadTracksWithMediaType:AVMediaTypeAudio completionHandler:^(NSArray<AVAssetTrack *> * _Nullable tracks, NSError * _Nullable loadError) {}];
}
