import Foundation
import AVFoundation
import SwiftUI
import MediaPlayer

@MainActor
class AudioPlayerModel: ObservableObject {
    @Published var isPlaying = false
    @Published var currentTrack: Track?
    @Published var showFullPlayer = false
    @Published var queue: [Track] = []
    
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
        if isPlaying {
            player?.pause()
        } else {
            player?.play()
        }
        isPlaying.toggle()
    }
    
    func play(track: Track) {
        currentTrack = track
        isPlaying = true
        
        Task {
            do {
                // Obtenemos la URL del stream en MP3/FLAC desde Qobuz
                if let streamUrl = try await QobuzAPI.shared.getTrackUrl(trackId: track.id, formatId: 5) {
                    let playerItem = AVPlayerItem(url: streamUrl)
                    if self.player == nil {
                        self.player = AVPlayer(playerItem: playerItem)
                    } else {
                        self.player?.replaceCurrentItem(with: playerItem)
                    }
                    self.player?.play()
                    self.isPlaying = true
                    self.setupNowPlaying(track: track)
                }
            } catch {
                print("Error al obtener stream de Qobuz: \(error)")
                self.isPlaying = false
            }
        }
    }
    
    private func setupNowPlaying(track: Track) {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = track.title
        nowPlayingInfo[MPMediaItemPropertyArtist] = track.artist
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
}
