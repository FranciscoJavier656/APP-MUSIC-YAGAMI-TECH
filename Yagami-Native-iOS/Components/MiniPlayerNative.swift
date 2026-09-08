import SwiftUI

struct MiniPlayerNative: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            Button {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                    audioPlayer.showFullPlayer = true
                }
            } label: {
                VStack(spacing: 0) {
                    HStack(spacing: 12) {
                        // Artwork (Animación de escala eliminada para evitar glitches en la TabBar)
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
                                .foregroundColor(.primary)
                                .lineLimit(1)
                            Text(track.artist)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                        
                        Spacer()
                        
                        // Mini Visualizador (Seguro porque tiene un frame fijo)
                        HStack(alignment: .bottom, spacing: 2) {
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
                        .buttonStyle(.plain) // Evita conflictos con el botón padre
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                }
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                )
                .shadow(color: .black.opacity(0.1), radius: 10, y: 5)
            }
            .buttonStyle(.plain)
        }
    }
}
