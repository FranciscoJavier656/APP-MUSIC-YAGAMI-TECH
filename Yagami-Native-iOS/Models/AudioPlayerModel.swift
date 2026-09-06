import SwiftUI
import AVFoundation

class AudioPlayerModel: ObservableObject {
    @Published var isPlaying = false
    @Published var currentTrack: Track? = mockLibrary.first
    @Published var showFullPlayer = false
    
    private var player: AVPlayer?
    
    init() {
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Error configurando AVFoundation: \(error)")
        }
    }
    
    func togglePlay() {
        isPlaying.toggle()
    }
    
    func play(track: Track) {
        currentTrack = track
        isPlaying = true
    }
}
