import SwiftUI

struct PlayerView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            ZStack {
                // Background Ambient Light (Aura)
                GeometryReader { geo in
                    AsyncImage(url: track.imageUrl) { phase in
                        if let image = phase.image {
                            image.resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                // Efecto Ambient Light que reacciona a la música
                                .scaleEffect(1.0 + (audioPlayer.averageVolume * 0.3))
                                .blur(radius: 80 - (audioPlayer.averageVolume * 20))
                                .overlay(.black.opacity(0.4))
                                .animation(.easeOut(duration: 0.1), value: audioPlayer.averageVolume)
                        } else {
                            Color.black
                        }
                    }
                }
                .ignoresSafeArea()
                
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
                        Text("Reproduciendo de Qobuz")
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
                    
                    // Artwork con Drop Shadow dinámico
                    AsyncImage(url: track.imageUrl) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFit()
                        } else {
                            Rectangle().fill(Color.gray.opacity(0.3))
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                    .padding(.horizontal, 32)
                    .shadow(color: .black.opacity(0.6), radius: 30, y: 20)
                    .scaleEffect(1.0 + (audioPlayer.averageVolume * 0.05)) // Pequeño latido de la portada
                    .animation(.interactiveSpring(response: 0.1, dampingFraction: 0.8), value: audioPlayer.averageVolume)
                    
                    // Track Info
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(track.title)
                                    .font(.title2)
                                    .bold()
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                                Text(track.artist)
                                    .font(.title3)
                                    .foregroundColor(.white.opacity(0.7))
                                    .lineLimit(1)
                            }
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    // Espectrograma (FFT Visualizer)
                    HStack(spacing: 3) {
                        ForEach(0..<audioPlayer.fftData.count, id: \.self) { index in
                            let height = max(4, audioPlayer.fftData[index] * 80) // Max 80px altura
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white.opacity(0.8))
                                .frame(width: 3, height: height)
                                .animation(.linear(duration: 0.05), value: audioPlayer.fftData[index])
                        }
                    }
                    .frame(height: 80)
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
                                // Sutil efecto de luz en el botón
                                .shadow(color: .white.opacity(Double(audioPlayer.averageVolume)), radius: 10, y: 0)
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
