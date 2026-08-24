const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

// 1. Revert FFT size to 1024 (iOS audio buffers are usually 1024, so 4096 causes the tap to exit early)
code = code.replace('#define FFT_SIZE 4096', '#define FFT_SIZE 1024');
code = code.replace('context->log2n = 12; // log2(4096)', 'context->log2n = 10; // log2(1024)');
code = code.replace('int halfSize = context->fftSize / 2; // 2048', 'int halfSize = context->fftSize / 2;');

// 2. Adjust Mel scale bin calculations for 1024 resolution (43.06 Hz per bin)
const oldMel = `float freq = 700.0 * (powf(10.0, mel / 2595.0) - 1.0);
        int binIndex = (int)(freq / 10.766);`;
const newMel = `float freq = 700.0 * (powf(10.0, mel / 2595.0) - 1.0);
        int binIndex = (int)(freq / 43.066);`;
code = code.replace(oldMel, newMel);

// 3. Fix potential CFRelease race condition
const oldTap = `            dispatch_async(dispatch_get_main_queue(), ^{
                playerItem.audioMix = audioMix;
                [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
            });
            CFRelease(tap); // Crucial to prevent memory leaks when changing tracks`;
const newTap = `            dispatch_async(dispatch_get_main_queue(), ^{
                playerItem.audioMix = audioMix;
                [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
                CFRelease(tap); // Release after assigning to prevent early deallocation
            });`;
code = code.replace(oldTap, newTap);

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);

// 4. Update the Canvas drawing to look much more premium
let reactCode = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
const oldDraw = `          for (let i = 0; i < bufferLength; i++) {
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + dataArray[i] * 0.30;
            
            const barHeight = (smoothed[i] / 255) * canvas.height;
            
            ctx.fillStyle = \`rgba(120, 120, 120, \${0.2 + (smoothed[i]/255)*0.8})\`; 
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
          }`;

const newDraw = `          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const baseRgb = isDarkMode ? '255, 255, 255' : '0, 0, 0';
          
          for (let i = 0; i < bufferLength; i++) {
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + dataArray[i] * 0.30;
            
            let barHeight = (smoothed[i] / 255) * canvas.height;
            if (barHeight < 3) barHeight = 3; // Minimum height for silence
            
            ctx.fillStyle = \`rgba(\${baseRgb}, \${0.15 + (smoothed[i]/255)*0.85})\`; 
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
            } else {
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            }
            ctx.fill();
            x += barWidth;
          }`;
reactCode = reactCode.replace(oldDraw, newDraw);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', reactCode);
