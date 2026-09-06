import SwiftUI

struct PlayerView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            ZStack {
                // Background Blur
                LinearGradient(colors: track.artworkColors, startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()
                    .overlay(.ultraThinMaterial)
                
                VStack(spacing: 32) {
                    // Header
                    HStack {
                        Button {
                            withAnimation { audioPlayer.showFullPlayer = false }
                        } label: {
                            Image(systemName: "chevron.down")
                                .font(.title2)
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text("Reproduciendo")
                            .font(.caption)
                            .bold()
                            .foregroundColor(.white.opacity(0.8))
                        Spacer()
                        Button {
                        } label: {
                            Image(systemName: "ellipsis")
                                .font(.title2)
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 40)
                    
                    // Artwork
                    RoundedRectangle(cornerRadius: 24)
                        .fill(LinearGradient(colors: track.artworkColors, startPoint: .topLeading, endPoint: .bottomTrailing))
                        .aspectRatio(1, contentMode: .fit)
                        .padding(.horizontal, 32)
                        .shadow(color: .black.opacity(0.3), radius: 20, y: 10)
                    
                    // Track Info
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(track.title)
                                    .font(.title2)
                                    .bold()
                                    .foregroundColor(.white)
                                Text(track.artist)
                                    .font(.title3)
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    // Controls
                    HStack(spacing: 40) {
                        Image(systemName: "backward.fill")
                            .font(.largeTitle)
                            .foregroundColor(.white)
                        
                        Button {
                            audioPlayer.togglePlay()
                        } label: {
                            Image(systemName: audioPlayer.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                .font(.system(size: 80))
                                .foregroundColor(.white)
                        }
                        
                        Image(systemName: "forward.fill")
                            .font(.largeTitle)
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                }
            }
            .gesture(
                DragGesture().onEnded { value in
                    if value.translation.height > 100 {
                        withAnimation { audioPlayer.showFullPlayer = false }
                    }
                }
            )
        }
    }
}
