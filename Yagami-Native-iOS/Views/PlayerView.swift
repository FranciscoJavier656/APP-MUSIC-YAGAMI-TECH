import SwiftUI

struct PlayerView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @Environment(\.dismiss) var dismiss
    
    @State private var showLyrics = false
    @State private var isDraggingSlider = false
    @State private var sliderValue: TimeInterval = 0
    
    var body: some View {
        if let track = audioPlayer.currentTrack {
            ZStack {
                // 1. Background
                Color.black.ignoresSafeArea()
                .animation(.easeOut(duration: 0.1), value: audioPlayer.averageVolume)
                
                // Aura (Radial gradient)
                RadialGradient(
                    gradient: Gradient(colors: [audioPlayer.artworkColor.opacity(0.3 + (audioPlayer.averageVolume * 0.4)), Color.clear]),
                    center: .top,
                    startRadius: 0,
                    endRadius: 600 + (audioPlayer.averageVolume * 200)
                )
                .blendMode(.screen)
                .ignoresSafeArea()
                .animation(.easeOut(duration: 0.1), value: audioPlayer.averageVolume)
                
                VStack(spacing: 0) {
                    // 2. Header
                    HStack {
                        Button {
                            withAnimation { audioPlayer.showFullPlayer = false }
                        } label: {
                            Image(systemName: "chevron.down")
                                .font(.title2)
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44) // better touch target
                        }
                        Spacer()
                        VStack(spacing: 2) {
                            Text("REPRODUCIENDO DESDE")
                                .font(.system(size: 11, weight: .bold))
                                .kerning(1.5)
                                .foregroundColor(.white.opacity(0.4))
                            Text("QOBUZ")
                                .font(.system(size: 13, weight: .semibold))
                                .kerning(2.0)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        Spacer()
                        HStack(spacing: 4) {
                            Button { } label: { 
                                Image(systemName: "ellipsis")
                                    .font(.title2)
                                    .foregroundColor(.white)
                                    .frame(width: 44, height: 44)
                            }
                            Button { } label: { 
                                Image(systemName: "text.line.bullet")
                                    .font(.title2)
                                    .foregroundColor(.white)
                                    .frame(width: 44, height: 44)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 40)
                    
                    Spacer().frame(height: 32)
                    
                    // 3. Artwork Flip View
                    ZStack {
                        if showLyrics {
                            RoundedRectangle(cornerRadius: 24)
                                .fill(Color.black.opacity(0.5))
                                .overlay(
                                    VStack(alignment: .leading, spacing: 16) {
                                        Button(action: { withAnimation { showLyrics = false } }) {
                                            Text("VOLVER A PORTADA")
                                                .font(.caption).bold()
                                                .padding(8)
                                                .background(Color.white.opacity(0.2))
                                                .cornerRadius(8)
                                                .foregroundColor(.white)
                                        }
                                        Spacer()
                                        Text("It's WICKED OUTSIDE")
                                            .font(.title2).bold().foregroundColor(.white.opacity(0.5))
                                        Text("Rio control, Rio control")
                                            .font(.title).bold().foregroundColor(.white)
                                        Text("Del 3-0-8. porte SCAR")
                                            .font(.title2).bold().foregroundColor(.white.opacity(0.5))
                                        Spacer()
                                    }
                                    .padding()
                                )
                                .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
                        } else {
                            AsyncImage(url: track.imageUrl) { phase in
                                if let image = phase.image {
                                    image.resizable().scaledToFit()
                                } else {
                                    Rectangle().fill(Color.white.opacity(0.1))
                                }
                            }
                            .clipShape(RoundedRectangle(cornerRadius: 24))
                            .shadow(color: .black.opacity(0.8), radius: 30, y: 20)
                            .scaleEffect(1.0 + (audioPlayer.averageVolume * 0.03))
                            .animation(.interactiveSpring(response: 0.1, dampingFraction: 0.8), value: audioPlayer.averageVolume)
                        }
                    }
                    .aspectRatio(1, contentMode: .fit)
                    .padding(.horizontal, 32)
                    .rotation3DEffect(.degrees(showLyrics ? 180 : 0), axis: (x: 0, y: 1, z: 0))
                    .onTapGesture {
                        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                            showLyrics.toggle()
                        }
                    }
                    
                    // 4. FFT Visualizer
                    // 4. NATIVE CANVAS FFT VISUALIZER (Exact HTML5 Canvas Replication)
                    Canvas { context, size in
                        let barCount = 64
                        let spacing: CGFloat = 3
                        let totalSpacing = spacing * CGFloat(barCount - 1)
                        let barWidth = (size.width - totalSpacing) / CGFloat(barCount)
                        
                        for index in 0..<barCount {
                            let val = audioPlayer.fftData.indices.contains(index) ? audioPlayer.fftData[index] : 0
                            let height = max(4, val * 60)
                            let x = CGFloat(index) * (barWidth + spacing)
                            let y = size.height - height
                            
                            let rect = CGRect(x: x, y: y, width: barWidth, height: height)
                            let path = Path(roundedRect: rect, cornerRadius: 2)
                            
                            let opacity = 0.3 + Double(val * 0.7)
                            context.fill(path, with: .color(audioPlayer.artworkColor.opacity(opacity)))
                        }
                    }
                    .frame(height: 60)
                    .padding(.horizontal, 32)
                    .padding(.top, 16)
                    
                    Spacer().frame(height: 24)
                    
                    // 5. Track Info & Actions
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(track.title)
                                .font(.system(size: 26, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            HStack(spacing: 12) {
                                Text(track.artist)
                                    .font(.system(size: 18))
                                    .foregroundColor(.white.opacity(0.6))
                                    .lineLimit(1)
                                
                                Text("LOSSLESS")
                                    .font(.system(size: 9, weight: .bold))
                                    .kerning(1.5)
                                    .foregroundColor(.white.opacity(0.8))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 3)
                                    .background(Color.white.opacity(0.1))
                                    .cornerRadius(4)
                                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            }
                        }
                        Spacer(minLength: 16)
                        HStack(spacing: 12) {
                            Button { DownloadManager.shared.startDownload(track: track) } label: { 
                                Image(systemName: "arrow.down")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(width: 40, height: 40)
                                    .background(Color.white.opacity(0.1))
                                    .clipShape(Circle())
                            }
                            Button { } label: { 
                                Image(systemName: "ellipsis")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(width: 40, height: 40)
                                    .background(Color.white.opacity(0.1))
                                    .clipShape(Circle())
                            }
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    Spacer().frame(height: 24)
                    
                    // 6. Progress Bar
                    VStack(spacing: 8) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.white.opacity(0.1))
                                    .frame(height: 6)
                                
                                let currentProgress = isDraggingSlider ? sliderValue : audioPlayer.currentTime
                                let percent = audioPlayer.duration > 0 ? (currentProgress / audioPlayer.duration) : 0
                                Capsule()
                                    .fill(audioPlayer.artworkColor)
                                    .frame(width: max(0, geo.size.width * CGFloat(percent)))
                            }
                            .contentShape(Rectangle()) // Make tappable
                            .gesture(
                                DragGesture(minimumDistance: 0)
                                    .onChanged { value in
                                        isDraggingSlider = true
                                        let percent = min(max(value.location.x / geo.size.width, 0), 1)
                                        sliderValue = audioPlayer.duration * Double(percent)
                                    }
                                    .onEnded { value in
                                        let percent = min(max(value.location.x / geo.size.width, 0), 1)
                                        audioPlayer.seek(to: audioPlayer.duration * Double(percent))
                                        isDraggingSlider = false
                                    }
                            )
                        }
                        .frame(height: 6)
                        
                        HStack {
                            Text(formatTime(isDraggingSlider ? sliderValue : audioPlayer.currentTime))
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundColor(.white.opacity(0.5))
                            Spacer()
                            Text("-" + formatTime(audioPlayer.duration - (isDraggingSlider ? sliderValue : audioPlayer.currentTime)))
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundColor(.white.opacity(0.5))
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    Spacer().frame(height: 24)
                    
                    // 7. Transport Controls
                    HStack {
                        Button { } label: { Image(systemName: "shuffle").font(.title2).foregroundColor(.white.opacity(0.3)) }
                        Spacer()
                        Button { } label: { Image(systemName: "backward.end.fill").font(.title).foregroundColor(.white) }
                        Spacer()
                        
                        Button {
                            audioPlayer.togglePlay()
                        } label: {
                            ZStack {
                                Circle()
                                    .fill(audioPlayer.artworkColor)
                                    .frame(width: 80, height: 80)
                                    .shadow(color: audioPlayer.artworkColor.opacity(0.5), radius: 10 + (audioPlayer.averageVolume * 15), y: 0)
                                
                                Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(.white)
                            }
                        }
                        
                        Spacer()
                        Button { } label: { Image(systemName: "forward.end.fill").font(.title).foregroundColor(.white) }
                        Spacer()
                        Button { } label: { Image(systemName: "repeat").font(.title2).foregroundColor(.white.opacity(0.3)) }
                    }
                    .padding(.horizontal, 32)
                    
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
        } else {
            Color.black.ignoresSafeArea()
                .animation(.easeOut(duration: 0.1), value: audioPlayer.averageVolume)
        }
    }
    
    private func formatTime(_ time: TimeInterval) -> String {
        if time.isNaN || time.isInfinite { return "0:00" }
        let timeToUse = max(0, time)
        let minutes = Int(timeToUse) / 60
        let seconds = Int(timeToUse) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}
