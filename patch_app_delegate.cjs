const fs = require('fs');

let code = fs.readFileSync('ios/App/App/AppDelegate.swift', 'utf8');

const importStr = 'import AVFoundation\nimport Capacitor';
code = code.replace('import Capacitor', importStr);

const sessionStr = `
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set audio session category.")
        }
        return true
`;
code = code.replace('return true', sessionStr);

fs.writeFileSync('ios/App/App/AppDelegate.swift', code);
