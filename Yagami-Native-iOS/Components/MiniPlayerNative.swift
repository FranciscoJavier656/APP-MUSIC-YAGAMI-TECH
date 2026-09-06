import SwiftUI

struct MiniPlayerNative: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    // Artwork
                    AsyncImage(url: track.imageUrl) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFill()
                        } else {
                            Rectangle().fill(Color.gray)
                        }
                    }
                    .frame(width: 44, height: 44)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .shadow(radius: 3)
                    
                    // Info
                    VStack(alignment: .leading, spacing: 2) {
                        Text(track.title)
                            .font(.subheadline)
                            .bold()
                            .lineLimit(1)
                        Text(track.artist)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    // Controls
                    Button {
                        audioPlayer.togglePlay()
                    } label: {
                        Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
                            .font(.title2)
                            .foregroundColor(.primary)
                            .frame(width: 44, height: 44)
                    }
                    
                    Button {
                        // Next track action
                    } label: {
                        Image(systemName: "forward.fill")
                            .font(.title3)
                            .foregroundColor(.primary)
                            .frame(width: 44, height: 44)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                
                // Progress Bar (Slim)
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 2)
                        
                        Rectangle()
                            .fill(Color.primary)
                            .frame(width: geometry.size.width * 0.3, height: 2) // Simulado por ahora
                    }
                }
                .frame(height: 2)
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
            )
            .shadow(color: .black.opacity(0.2), radius: 10, y: 5)
            .onTapGesture {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                    audioPlayer.showFullPlayer = true
                }
            }
        }
    }
}
