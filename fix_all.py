import os

# 1. Track.swift
f = "Yagami-Native-iOS/Models/Track.swift"
with open(f, "r") as file: c = file.read()
c = c.replace("struct Track: Identifiable, Equatable {", "struct Track: Identifiable, Equatable, Codable {")
with open(f, "w") as file: file.write(c)

# 2. DownloadManager.swift
f = "Yagami-Native-iOS/Models/DownloadManager.swift"
with open(f, "r") as file: c = file.read()
c = c.replace("var id: String { track.id }", "var id: Int { track.id }")
c = c.replace("func deleteDownload(trackId: String) {", "func deleteDownload(trackId: Int) {")
with open(f, "w") as file: file.write(c)

# 3. AudioPlayerModel.swift
f = "Yagami-Native-iOS/Models/AudioPlayerModel.swift"
with open(f, "r") as file: c = file.read()
c = c.replace("    nonisolated let fftSize: Int = 1024\n    nonisolated let log2n: vDSP_Length = vDSP_Length(log2(Float(1024)))\n    nonisolated let fftSetup: FFTSetup? = vDSP_create_fftsetup(vDSP_Length(log2(Float(1024))), FFTRadix(kFFTRadix2))", 
"""    nonisolated let fftSize: Int = 1024
    nonisolated let log2n: vDSP_Length = vDSP_Length(log2(Float(1024)))
    private let fftContext = FFTContext()
    
    struct FFTContext: @unchecked Sendable {
        let setup = vDSP_create_fftsetup(vDSP_Length(log2(Float(1024))), FFTRadix(kFFTRadix2))
    }""")
c = c.replace("if let setup = fftSetup {", "if let setup = fftContext.setup {")
c = c.replace("""        self.timeObserver = self.player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = time.seconds
            if let duration = self?.player?.currentItem?.duration.seconds, !duration.isNaN {
                self?.duration = duration
            }
        }""",
"""        self.timeObserver = self.player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            Task { @MainActor [weak self] in
                self?.currentTime = time.seconds
                if let duration = self?.player?.currentItem?.duration.seconds, !duration.isNaN {
                    self?.duration = duration
                }
            }
        }""")
with open(f, "w") as file: file.write(c)

# 4. HomeView.swift
f = "Yagami-Native-iOS/Views/HomeView.swift"
with open(f, "r") as file: c = file.read()
c = c.replace(".onChange(of: activeCategory) { _ in", ".onChange(of: activeCategory) { oldValue, newValue in")
c = c.replace("""            async let ep = QobuzAPI.shared.getFeaturedAlbumsWithGenre(type: "editor-picks", genreId: genreId, limit: limit)
            async let ms = QobuzAPI.shared.getFeaturedAlbumsWithGenre(type: "most-streamed", genreId: genreId, limit: limit)""",
"""            let safeGenreId = genreId
            let safeLimit = limit
            async let ep = QobuzAPI.shared.getFeaturedAlbumsWithGenre(type: "editor-picks", genreId: safeGenreId, limit: safeLimit)
            async let ms = QobuzAPI.shared.getFeaturedAlbumsWithGenre(type: "most-streamed", genreId: safeGenreId, limit: safeLimit)""")
with open(f, "w") as file: file.write(c)

# 5. SearchView.swift
f = "Yagami-Native-iOS/Views/SearchView.swift"
with open(f, "r") as file: c = file.read()
c = c.replace(".onChange(of: query) { newValue in", ".onChange(of: query) { oldValue, newValue in")
with open(f, "w") as file: file.write(c)

# 6. PlayerView.swift
f = "Yagami-Native-iOS/Views/PlayerView.swift"
with open(f, "r") as file: c = file.read()
c = c.replace("endRadius: UIScreen.main.bounds.height * 0.7", "endRadius: 600")

slider_original = """                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.1))
                                .frame(height: 6)
                            
                            GeometryReader { geo in
                                let percent = audioPlayer.duration > 0 ? (audioPlayer.currentTime / audioPlayer.duration) : 0
                                Capsule()
                                    .fill(audioPlayer.artworkColor)
                                    .frame(width: max(0, geo.size.width * CGFloat(percent)))
                            }
                            .frame(height: 6)
                        }
                        .contentShape(Rectangle()) // Make tappable
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    isDraggingSlider = true
                                    let percent = min(max(value.location.x / UIScreen.main.bounds.width, 0), 1)
                                    sliderValue = audioPlayer.duration * Double(percent)
                                }
                                .onEnded { value in
                                    let percent = min(max(value.location.x / UIScreen.main.bounds.width, 0), 1)
                                    audioPlayer.seek(to: audioPlayer.duration * Double(percent))
                                    isDraggingSlider = false
                                }
                        )"""

slider_new = """                        GeometryReader { geo in
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
                        .frame(height: 6)"""
c = c.replace(slider_original, slider_new)
with open(f, "w") as file: file.write(c)

