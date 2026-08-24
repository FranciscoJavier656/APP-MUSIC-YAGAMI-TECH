#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>
#import <AVFoundation/AVFoundation.h>
#import <MediaToolbox/MediaToolbox.h>
#import <Accelerate/Accelerate.h>

#define FFT_SIZE 1024

@interface QobuzAudioPlugin : CAPPlugin
@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) NSTimeInterval lastFftUpdate;
@property (nonatomic, strong) id errorLogObservation;
@end

@interface QobuzAudioPlugin (CAPPluginCategory) <CAPBridgedPlugin>
@end

@implementation QobuzAudioPlugin (CAPPluginCategory)
- (NSString *)identifier { return @"QobuzAudioPlugin"; }
- (NSString *)jsName { return @"QobuzAudio"; }
- (NSArray *)pluginMethods {
    NSMutableArray *methods = [NSMutableArray new];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"play" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"pause" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"resume" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"seek" returnType:CAPPluginReturnPromise]];
    return methods;
}
@end

// Context for the audio tap
typedef struct {
    void *plugin;
    FFTSetup fftSetup;
    int fftSize;
    int log2n;
    float *window;
    float *realBuffer;
    float *imagBuffer;
    float *magnitudes;
    DSPSplitComplex splitComplex;
} TapContext;

// MTAudioProcessingTap callbacks
static void tapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut) {
    TapContext *context = (TapContext *)malloc(sizeof(TapContext));
    context->plugin = clientInfo;
    context->fftSize = FFT_SIZE;
    context->log2n = 10; // log2(1024)
    context->fftSetup = vDSP_create_fftsetup((vDSP_Length)context->log2n, kFFTRadix2);
    
    int halfSize = context->fftSize / 2;
    context->window = (float *)malloc(sizeof(float) * context->fftSize);
    context->realBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->imagBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->magnitudes = (float *)malloc(sizeof(float) * halfSize);
    context->splitComplex.realp = context->realBuffer;
    context->splitComplex.imagp = context->imagBuffer;
    
    vDSP_hann_window(context->window, (vDSP_Length)context->fftSize, vDSP_HANN_NORM);
    *tapStorageOut = context;
}

static void tapFinalize(MTAudioProcessingTapRef tap) {
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (context) {
        vDSP_destroy_fftsetup(context->fftSetup);
        free(context->window);
        free(context->realBuffer);
        free(context->imagBuffer);
        free(context->magnitudes);
        free(context);
    }
}

static void tapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat) {}
static void tapUnprepare(MTAudioProcessingTapRef tap) {}

static void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut) {
    
    OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
    if (status != noErr) return;
    
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (!context || numberFrames < context->fftSize) return;
    
    QobuzAudioPlugin *plugin = (__bridge QobuzAudioPlugin *)context->plugin;
    if (!plugin.isPlaying) return;
    
    NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
    if (now - plugin.lastFftUpdate < 0.033) return; // approx 30fps
    
    float *samples = (float *)bufferListInOut->mBuffers[0].mData;
    if (!samples) return;
    
    int halfSize = context->fftSize / 2;
    float windowedBuffer[FFT_SIZE];
    
    vDSP_vmul(samples, 1, context->window, 1, windowedBuffer, 1, (vDSP_Length)context->fftSize);
    vDSP_ctoz((DSPComplex *)windowedBuffer, 2, &context->splitComplex, 1, (vDSP_Length)halfSize);
    vDSP_fft_zrip(context->fftSetup, &context->splitComplex, 1, (vDSP_Length)context->log2n, FFT_FORWARD);
    vDSP_zvabs(&context->splitComplex, 1, context->magnitudes, 1, (vDSP_Length)halfSize);
    
    float scale = 2.0 / (float)context->fftSize;
    vDSP_vsmul(context->magnitudes, 1, &scale, context->magnitudes, 1, (vDSP_Length)halfSize);
    
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:64];
    for (int i = 0; i < 64; i++) {
        float val = context->magnitudes[i] * 5.0;
        int scaled = MIN(MAX((int)(val * 255.0), 0), 255);
        [result addObject:@(scaled)];
    }
    
    plugin.lastFftUpdate = now;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [plugin notifyListeners:@"onFftData" data:@{@"data": result}];
    });
}


@implementation QobuzAudioPlugin

- (void)logMessage:(NSString *)msg {
    NSLog(@"[QOBUZ NATIVE] %@", msg);
    dispatch_async(dispatch_get_main_queue(), ^{
        [self notifyListeners:@"onDebugLog" data:@{@"message": msg}];
    });
}

- (void)play:(CAPPluginCall *)call {
    NSString *urlString = call.options[@"url"];
    if (!urlString || ![urlString isKindOfClass:[NSString class]]) {
        [self logMessage:@"❌ Error: URL inválida"];
        [call resolve];
        return;
    }
    
    NSURL *url = [NSURL URLWithString:urlString];
    if (!url) {
        [call resolve];
        return;
    }
    
    [self logMessage:@"-------------"];
    [self logMessage:[NSString stringWithFormat:@"▶️ Iniciando URL: %@", urlString]];
    
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeDefault error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:&error];
    
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:asset];
    
    __weak typeof(self) weakSelf = self;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        weakSelf.player = [AVPlayer playerWithPlayerItem:playerItem];
        
        if (weakSelf.errorLogObservation) {
            [[NSNotificationCenter defaultCenter] removeObserver:weakSelf.errorLogObservation];
        }
        
        weakSelf.errorLogObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemFailedToPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            NSError *err = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
            [weakSelf logMessage:[NSString stringWithFormat:@"⚠️ Error interno AVPlayer: %@", err.localizedDescription]];
        }];
        
        [weakSelf.player play];
        weakSelf.isPlaying = YES;
        [weakSelf logMessage:@"🚀 Play() ejecutado. Obj-C manejando todo."];
        [call resolve];
    });
    
    // Instead of async loadTracksWithMediaType (iOS 15+) which may cause CI symbol issues,
    // we use synchronous tracksWithMediaType (deprecated in 15, but compiles safely on all versions).
    // This is running on the Capacitor background bridge thread anyway, so it won't block the UI.
    NSArray<AVAssetTrack *> *tracks = [asset tracksWithMediaType:AVMediaTypeAudio];
    if (!tracks || tracks.count == 0) {
        [self logMessage:@"❌ No se encontró pista de audio en ObjC"];
        return;
    }
    
    AVAssetTrack *audioTrack = tracks.firstObject;
    
    MTAudioProcessingTapCallbacks callbacks;
    callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
    callbacks.clientInfo = (__bridge void *)self; // Safe: plugin singleton outlives tap
    callbacks.init = tapInit;
    callbacks.finalize = tapFinalize;
    callbacks.prepare = tapPrepare;
    callbacks.unprepare = tapUnprepare;
    callbacks.process = tapProcess;
    
    MTAudioProcessingTapRef tap;
    OSStatus status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &tap);
    
    if (status == noErr && tap) {
        AVMutableAudioMixInputParameters *inputParams = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:audioTrack];
        inputParams.audioTapProcessor = tap;
        
        AVMutableAudioMix *audioMix = [AVMutableAudioMix audioMix];
        audioMix.inputParameters = @[inputParams];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            playerItem.audioMix = audioMix;
            [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
        });
    } else {
        [self logMessage:[NSString stringWithFormat:@"❌ Error creando Tap en ObjC (Status: %d)", (int)status]];
    }
}

- (void)pause:(CAPPluginCall *)call {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player pause];
        self.isPlaying = NO;
        [call resolve];
    });
}

- (void)resume:(CAPPluginCall *)call {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player play];
        self.isPlaying = YES;
        [call resolve];
    });
}

- (void)seek:(CAPPluginCall *)call {
    NSNumber *timeNum = call.options[@"time"];
    if (!timeNum || ![timeNum isKindOfClass:[NSNumber class]]) {
        [call resolve];
        return;
    }
    
    CMTime targetTime = CMTimeMakeWithSeconds([timeNum doubleValue], 600);
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player seekToTime:targetTime];
        [call resolve];
    });
}

@end
