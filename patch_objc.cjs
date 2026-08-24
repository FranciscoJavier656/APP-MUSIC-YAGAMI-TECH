const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

// Fix the array serialization vs base64
const oldFftSend = `    uint8_t outBuffer[NUM_BINS];
    
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
        outBuffer[i] = (uint8_t)scaled;
    }
    
    NSData *dataObj = [NSData dataWithBytes:outBuffer length:NUM_BINS];
    NSString *base64String = [dataObj base64EncodedStringWithOptions:0];
    
    plugin.lastFftUpdate = now;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [plugin notifyListeners:@"onFftData" data:@{@"data": base64String}];
    });`;

const newFftSend = `    NSMutableArray *result = [NSMutableArray arrayWithCapacity:NUM_BINS];
    
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
    });`;

code = code.replace(oldFftSend, newFftSend);

// Fix the observer crash
const oldObserver = `    dispatch_async(dispatch_get_main_queue(), ^{
        weakSelf.player = [AVPlayer playerWithPlayerItem:playerItem];
        
        if (weakSelf.errorLogObservation) {
            [[NSNotificationCenter defaultCenter] removeObserver:weakSelf.errorLogObservation];
        }
        
        weakSelf.errorLogObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemFailedToPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            NSError *err = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
            [weakSelf logMessage:[NSString stringWithFormat:@"⚠️ Error interno AVPlayer: %@", err.localizedDescription]];
        }];
        
        if (weakSelf.timeObserver) {
            [weakSelf.player removeTimeObserver:weakSelf.timeObserver];
            weakSelf.timeObserver = nil;
        }`;

const newObserver = `    dispatch_async(dispatch_get_main_queue(), ^{
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
        }];`;

code = code.replace(oldObserver, newObserver);

// Fix the tap leak
const oldTap = `            dispatch_async(dispatch_get_main_queue(), ^{
                playerItem.audioMix = audioMix;
                [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
            });
        } else {`;

const newTap = `            dispatch_async(dispatch_get_main_queue(), ^{
                playerItem.audioMix = audioMix;
                [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
            });
            CFRelease(tap); // Crucial to prevent memory leaks when changing tracks
        } else {`;

code = code.replace(oldTap, newTap);

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
