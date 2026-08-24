#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>
#import <Capacitor/CAPBridgedJSTypes.h>
#import <Capacitor/Capacitor-Swift.h>
#import <AVFoundation/AVFoundation.h>
#import <MediaToolbox/MediaToolbox.h>
#import <Accelerate/Accelerate.h>

#define FFT_SIZE 4096
#define NUM_BINS 64

@interface QobuzAudioPlugin : CAPPlugin
@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) NSTimeInterval lastFftUpdate;
@property (nonatomic, strong) id errorLogObservation;
@property (nonatomic, strong) id timeObserver;
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
    int binIndices[NUM_BINS + 1];
} TapContext;

// MTAudioProcessingTap callbacks
static void tapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut) {
    TapContext *context = (TapContext *)malloc(sizeof(TapContext));
    context->plugin = clientInfo;
    context->fftSize = FFT_SIZE;
    context->log2n = 12; // log2(4096)
    context->fftSetup = vDSP_create_fftsetup((vDSP_Length)context->log2n, kFFTRadix2);
    
    int halfSize = context->fftSize / 2; // 2048
    context->window = (float *)malloc(sizeof(float) * context->fftSize);
    context->realBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->imagBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->magnitudes = (float *)malloc(sizeof(float) * halfSize);
    context->splitComplex.realp = context->realBuffer;
    context->splitComplex.imagp = context->imagBuffer;
    
    vDSP_hann_window(context->window, (vDSP_Length)context->fftSize, vDSP_HANN_NORM);
    
    // Pre-calculate Mel/Logarithmic Bin Indices
    // Sample rate approx 44100, Nyquist = 22050
    // Bin resolution = 22050 / 2048 = 10.76 Hz per bin
    float minFreq = 40.0;
    float maxFreq = 16000.0;
    float minMel = 2595.0 * log10f(1.0 + minFreq / 700.0);
    float maxMel = 2595.0 * log10f(1.0 + maxFreq / 700.0);
    
    for (int i = 0; i <= NUM_BINS; i++) {
        float mel = minMel + ((float)i / (float)NUM_BINS) * (maxMel - minMel);
        float freq = 700.0 * (powf(10.0, mel / 2595.0) - 1.0);
        int binIndex = (int)(freq / 10.766);
        if (binIndex < 1) binIndex = 1; // skip DC
        if (binIndex > halfSize - 1) binIndex = halfSize - 1;
        context->binIndices[i] = binIndex;
    }
    
    // Ensure minimum 1 bin width
    for (int i = 0; i < NUM_BINS; i++) {
        if (context->binIndices[i+1] <= context->binIndices[i]) {
            context->binIndices[i+1] = context->binIndices[i] + 1;
            if (context->binIndices[i+1] > halfSize - 1) {
                context->binIndices[i+1] = halfSize - 1;
            }
        }
    }
    
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
    
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:NUM_BINS];
    
    for (int i = 0; i < NUM_BINS; i++) {
        int startBin = context->binIndices[i];
        int endBin = context->binIndices[i+1];
        
        float maxVal = 0;
        for (int j = startBin; j < endBin; j++) {
            if (context->magnitudes[j] > maxVal) {
                maxVal = context->magnitudes[j];
            }
        }
        
        // Adjust gain based on frequency (higher frequencies need more boost)
        float freqBoost = 1.0 + ((float)i / (float)NUM_BINS) * 4.0;
        float val = maxVal * 25.0 * freqBoost; // tuned multiplier
        
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
        [self logMessage:@"❌ Error: URL mal formada"];
        [call resolve];
        return;
    }
    
    [self logMessage:@"-------------"];
    [self logMessage:[NSString stringWithFormat:@"▶️ Iniciando URL: %@", urlString]];
    
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:&error];
    
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:asset];
    
    __weak typeof(self) weakSelf = self;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // REMOVE OLD OBSERVERS BEFORE OVERWRITING THE PLAYER
        if (weakSelf.timeObserver && weakSelf.player) {
            [weakSelf.player removeTimeObserver:weakSelf.timeObserver];
            weakSelf.timeObserver = nil;
        }
        
        weakSelf.player = [AVPlayer playerWithPlayerItem:playerItem];
        
        if (weakSelf.errorLogObservation) {
            [[NSNotificationCenter defaultCenter] removeObserver:weakSelf.errorLogObservation];
        }
        
        weakSelf.errorLogObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemFailedToPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            NSError *err = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
            [weakSelf logMessage:[NSString stringWithFormat:@"⚠️ Error interno AVPlayer: %@", err.localizedDescription]];
        }];
        
        weakSelf.timeObserver = [weakSelf.player addPeriodicTimeObserverForInterval:CMTimeMake(1, 10) queue:dispatch_get_main_queue() usingBlock:^(CMTime time) {
            float currentTime = CMTimeGetSeconds(time);
            float duration = CMTimeGetSeconds(weakSelf.player.currentItem.duration);
            if (isnan(duration)) duration = 0;
            [weakSelf notifyListeners:@"onTimeUpdate" data:@{@"currentTime": @(currentTime), @"duration": @(duration)}];
        }];
        
        [weakSelf.player play];
        weakSelf.isPlaying = YES;
        [weakSelf logMessage:@"🚀 Play() ejecutado. Obj-C manejando todo."];
        [call resolve];
    });
    
    [asset loadTracksWithMediaType:AVMediaTypeAudio completionHandler:^(NSArray<AVAssetTrack *> * _Nullable tracks, NSError * _Nullable loadError) {
        if (!tracks || tracks.count == 0) {
            [weakSelf logMessage:@"❌ No se encontró pista de audio en ObjC"];
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
                [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
            });
            CFRelease(tap); // Crucial to prevent memory leaks when changing tracks
        } else {
            [weakSelf logMessage:[NSString stringWithFormat:@"❌ Error creando Tap en ObjC (Status: %d)", (int)status]];
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
