import SwiftUI

struct MiniPlayerNative: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    // Artwork con latido dinámico
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
                    .scaleEffect(1.0 + (audioPlayer.averageVolume * 0.1))
                    .animation(.interactiveSpring(response: 0.1, dampingFraction: 0.8), value: audioPlayer.averageVolume)
                    
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
                    
                    // Mini Visualizador (solo mostramos 16 barras centradas)
                    HStack(spacing: 2) {
                        ForEach(24..<40, id: \.self) { index in
                            let val = audioPlayer.fftData.indices.contains(index) ? audioPlayer.fftData[index] : 0
                            let height = max(2, val * 20)
                            RoundedRectangle(cornerRadius: 1)
                                .fill(Color.primary.opacity(0.8))
                                .frame(width: 2, height: height)
                                .animation(.linear(duration: 0.05), value: val)
                        }
                    }
                    .frame(height: 24, alignment: .center)
                    .padding(.trailing, 8)
                    
                    // Controls
                    Button {
                        audioPlayer.togglePlay()
                    } label: {
                        Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
                            .font(.title2)
                            .foregroundColor(.primary)
                            .frame(width: 44, height: 44)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
            )
            // Sombra tipo Aura en el MiniPlayer
            .shadow(color: .black.opacity(0.1 + Double(audioPlayer.averageVolume * 0.2)), radius: 10, y: 5)
            .onTapGesture {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                    audioPlayer.showFullPlayer = true
                }
            }
        }
    }
}
