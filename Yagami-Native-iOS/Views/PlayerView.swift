import SwiftUI

struct PlayerView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            ZStack {
                // Background Blur from Artwork
                GeometryReader { geo in
                    AsyncImage(url: track.imageUrl) { phase in
                        if let image = phase.image {
                            image.resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                .blur(radius: 60)
                                .overlay(.black.opacity(0.3)) // Darken to ensure text readability
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
                    
                    // Artwork
                    AsyncImage(url: track.imageUrl) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFit()
                        } else {
                            Rectangle().fill(Color.gray.opacity(0.3))
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                    .padding(.horizontal, 32)
                    .shadow(color: .black.opacity(0.5), radius: 30, y: 15)
                    
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
