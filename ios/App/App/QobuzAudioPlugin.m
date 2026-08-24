#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>
#import <Capacitor/CAPBridgedJSTypes.h>
#import <AVFoundation/AVFoundation.h>
#import <MediaToolbox/MediaToolbox.h>
#import <Accelerate/Accelerate.h>

@interface QobuzAudioPlugin : CAPPlugin
@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) NSTimeInterval lastFftUpdate;
@property (nonatomic, strong) id errorLogObservation;
@property (nonatomic, assign) int fftSize;
@property (nonatomic, assign) int log2n;
@property (nonatomic, assign) FFTSetup fftSetup;
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
    context->fftSize = 1024;
    context->log2n = log2(1024);
    context->fftSetup = vDSP_create_fftsetup(context->log2n, kFFTRadix2);
    
    int halfSize = context->fftSize / 2;
    context->window = (float *)malloc(sizeof(float) * context->fftSize);
    context->realBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->imagBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->magnitudes = (float *)malloc(sizeof(float) * halfSize);
    context->splitComplex.realp = context->realBuffer;
    context->splitComplex.imagp = context->imagBuffer;
    
    vDSP_hann_window(context->window, context->fftSize, vDSP_HANN_NORM);
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
    float windowedBuffer[context->fftSize];
    
    vDSP_vmul(samples, 1, context->window, 1, windowedBuffer, 1, context->fftSize);
    vDSP_ctoz((DSPComplex *)windowedBuffer, 2, &context->splitComplex, 1, halfSize);
    vDSP_fft_zrip(context->fftSetup, &context->splitComplex, 1, context->log2n, FFT_FORWARD);
    vDSP_zvabs(&context->splitComplex, 1, context->magnitudes, 1, halfSize);
    
    float scale = 2.0 / (float)context->fftSize;
    vDSP_vsmul(context->magnitudes, 1, &scale, context->magnitudes, 1, halfSize);
    
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
    NSString *urlString = [call getString:@"url" defaultValue:nil];
    if (!urlString) {
        [self logMessage:@"❌ Error: URL inválida"];
        [call reject:@"URL de stream inválida"];
        return;
    }
    
    NSURL *url = [NSURL URLWithString:urlString];
    if (!url) {
        [call reject:@"URL mal formada"];
        return;
    }
    
    [self logMessage:@"-------------"];
    [self logMessage:[NSString stringWithFormat:@"▶️ Iniciando URL: %@", urlString]];
    
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeDefault error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:&error];
    
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:asset];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        self.player = [AVPlayer playerWithPlayerItem:playerItem];
        
        if (self.errorLogObservation) {
            [[NSNotificationCenter defaultCenter] removeObserver:self.errorLogObservation];
        }
        
        __weak typeof(self) weakSelf = self;
        self.errorLogObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemFailedToPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            NSError *err = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
            [weakSelf logMessage:[NSString stringWithFormat:@"⚠️ Error interno AVPlayer: %@", err.localizedDescription]];
        }];
        
        [self.player play];
        self.isPlaying = YES;
        [self logMessage:@"🚀 Play() ejecutado. Obj-C manejando todo."];
        [call resolve];
    });
    
    [asset loadTracksWithMediaType:AVMediaTypeAudio completionHandler:^(NSArray<AVAssetTrack *> * _Nullable tracks, NSError * _Nullable loadError) {
        if (!tracks || tracks.count == 0) {
            [self logMessage:@"❌ No se encontró pista de audio en ObjC"];
            return;
        }
        
        AVAssetTrack *audioTrack = tracks.firstObject;
        
        MTAudioProcessingTapCallbacks callbacks;
        callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
        callbacks.clientInfo = (__bridge void *)self;
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
                [self logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
            });
        } else {
            [self logMessage:[NSString stringWithFormat:@"❌ Error creando Tap en ObjC (Status: %d)", (int)status]];
        }
    }];
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
    NSNumber *timeNum = [call getNumber:@"time" defaultValue:nil];
    if (!timeNum) {
        [call reject:@"Tiempo inválido"];
        return;
    }
    
    CMTime targetTime = CMTimeMakeWithSeconds([timeNum doubleValue], 600);
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player seekToTime:targetTime];
        [call resolve];
    });
}

@end

CAP_PLUGIN(QobuzAudioPlugin, "QobuzAudio",
    CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(seek, CAPPluginReturnPromise);
)
