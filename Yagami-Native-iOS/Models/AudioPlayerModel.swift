import Foundation
import AVFoundation
import SwiftUI
import MediaPlayer
import Accelerate
import MediaToolbox
import CoreImage

@MainActor
class AudioPlayerModel: ObservableObject, @unchecked Sendable {
    @Published var isPlaying = false
    @Published var currentTrack: Track?
    @Published var showFullPlayer = false
    @Published var queue: [Track] = []
    
    // Nativos FFT y Aura
    @Published var fftData: [CGFloat] = Array(repeating: 0, count: 64)
    @Published var averageVolume: CGFloat = 0.0
    
    // Reproductor y Progreso
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var artworkColor: Color = Color(UIColor.systemYellow) // Default
    
    private var player: AVPlayer?
    private var lastFftUpdate: TimeInterval = 0
    private var timeObserver: Any?
    
    nonisolated let fftSize: Int = 1024
    nonisolated let log2n: vDSP_Length = vDSP_Length(log2(Float(1024)))
    nonisolated let fftContext = FFTContext()
    
    struct FFTContext: @unchecked Sendable {
        let setup = vDSP_create_fftsetup(vDSP_Length(log2(Float(1024))), FFTRadix(kFFTRadix2))
    }

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
        
        if let url = track.imageUrl {
            extractColor(from: url)
        }
        
        Task {
            do {
                if let streamUrl = try await QobuzAPI.shared.getTrackUrl(trackId: track.id, formatId: 5) {
                    await setupPlayerWithTap(url: streamUrl, track: track)
                }
            } catch {
                print("Error al obtener stream de Qobuz: \(error)")
                self.isPlaying = false
            }
        }
    }
    
    private func extractColor(from url: URL) {
        Task.detached {
            if let (data, _) = try? await URLSession.shared.data(from: url), let uiImage = UIImage(data: data) {
                if let ciImage = CIImage(image: uiImage), let filter = CIFilter(name: "CIAreaAverage") {
                    let extentVector = CIVector(x: ciImage.extent.origin.x, y: ciImage.extent.origin.y, z: ciImage.extent.size.width, w: ciImage.extent.size.height)
                    filter.setValue(ciImage, forKey: kCIInputImageKey)
                    filter.setValue(extentVector, forKey: kCIInputExtentKey)
                    
                    if let outputImage = filter.outputImage {
                        var bitmap = [UInt8](repeating: 0, count: 4)
                        let context = CIContext(options: [.workingColorSpace: kCFNull as Any])
                        context.render(outputImage, toBitmap: &bitmap, rowBytes: 4, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: nil)
                        
                        let r = CGFloat(bitmap[0]) / 255.0
                        let g = CGFloat(bitmap[1]) / 255.0
                        let b = CGFloat(bitmap[2]) / 255.0
                        
                        let color = UIColor(red: r, green: g, blue: b, alpha: 1.0)
                        var h: CGFloat = 0, s: CGFloat = 0, br: CGFloat = 0, a: CGFloat = 0
                        color.getHue(&h, saturation: &s, brightness: &br, alpha: &a)
                        
                        // Boost saturation & brightness for vibrant UI feeling
                        let vibrant = UIColor(hue: h, saturation: min(s * 1.5, 1.0), brightness: max(min(br * 1.2, 1.0), 0.5), alpha: 1.0)
                        
                        await MainActor.run {
                            self.artworkColor = Color(vibrant)
                        }
                    }
                }
            }
        }
    }
    
    private func setupPlayerWithTap(url: URL, track: Track) async {
        let asset = AVURLAsset(url: url)
        let playerItem = AVPlayerItem(asset: asset)
        
        var callbacks = MTAudioProcessingTapCallbacks(
            version: kMTAudioProcessingTapCallbacksVersion_0,
            clientInfo: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
            init: { tap, clientInfo, tapStorageOut in
                tapStorageOut.pointee = clientInfo
            },
            finalize: { tap in },
            prepare: { tap, maxFrames, processingFormat in },
            unprepare: { tap in },
            process: { tap, numberFrames, flags, bufferListInOut, numberFramesOut, flagsOut in
                let status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, nil, numberFramesOut)
                if status == noErr {
                    let storage = MTAudioProcessingTapGetStorage(tap)
                    let plugin = Unmanaged<AudioPlayerModel>.fromOpaque(storage).takeUnretainedValue()
                    plugin.processAudioForFFT(bufferList: bufferListInOut, frames: numberFrames)
                }
            }
        )
        
        var tap: MTAudioProcessingTap?
        let status = MTAudioProcessingTapCreate(
            kCFAllocatorDefault,
            &callbacks,
            kMTAudioProcessingTapCreationFlag_PostEffects,
            &tap
        )
        
        do {
            let audioTracks = try await asset.load(.tracks)
            if let audioTrack = audioTracks.first(where: { $0.mediaType == .audio }) {
                if status == noErr, let tapProcessor = tap {
                    let inputParams = AVMutableAudioMixInputParameters(track: audioTrack)
                    inputParams.audioTapProcessor = tapProcessor
                    let audioMix = AVMutableAudioMix()
                    audioMix.inputParameters = [inputParams]
                    playerItem.audioMix = audioMix
                }
            }
        } catch {
            print("Error cargando pistas de audio para FFT: \(error)")
        }

        if self.player == nil {
            self.player = AVPlayer(playerItem: playerItem)
        } else {
            self.player?.replaceCurrentItem(with: playerItem)
        }
        
        // Progress Observer
        if let observer = self.timeObserver {
            self.player?.removeTimeObserver(observer)
            self.timeObserver = nil
        }
        
        let interval = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        self.timeObserver = self.player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            Task { @MainActor [weak self] in
                self?.currentTime = time.seconds
                if let duration = self?.player?.currentItem?.duration.seconds, !duration.isNaN {
                    self?.duration = duration
                }
            }
        }
        
        self.player?.play()
        self.isPlaying = true
        self.setupNowPlaying(track: track)
    }
    
    nonisolated func processAudioForFFT(bufferList: UnsafeMutablePointer<AudioBufferList>, frames: CMItemCount) {
        let ablPointer = UnsafeMutableAudioBufferListPointer(bufferList)
        guard let buffer = ablPointer.first?.mData else { return }
        
        let floatPointer = buffer.bindMemory(to: Float.self, capacity: Int(frames))
        var floatArray = [Float](UnsafeBufferPointer(start: floatPointer, count: Int(frames)))
        
        let halfSize = fftSize / 2
        var magnitudes = [Float](repeating: 0.0, count: halfSize)
        var real = [Float](repeating: 0.0, count: halfSize)
        var imag = [Float](repeating: 0.0, count: halfSize)
        
        real.withUnsafeMutableBufferPointer { realPtr in
            imag.withUnsafeMutableBufferPointer { imagPtr in
                guard let realBase = realPtr.baseAddress, let imagBase = imagPtr.baseAddress else { return }
                var complex = DSPSplitComplex(realp: realBase, imagp: imagBase)
                
                var window = [Float](repeating: 0, count: Int(frames))
                vDSP_hann_window(&window, vDSP_Length(frames), Int32(vDSP_HANN_NORM))
                vDSP_vmul(floatArray, 1, window, 1, &floatArray, 1, vDSP_Length(frames))
                
                floatArray.withUnsafeBufferPointer { floatBuffer in
                    if let baseAddr = floatBuffer.baseAddress {
                        baseAddr.withMemoryRebound(to: DSPComplex.self, capacity: halfSize) { complexPtr in
                            vDSP_ctoz(complexPtr, 2, &complex, 1, vDSP_Length(halfSize))
                        }
                    }
                }
                
                if let setup = fftContext.setup {
                    vDSP_fft_zrip(setup, &complex, 1, log2n, FFTDirection(FFT_FORWARD))
                    vDSP_zvmags(&complex, 1, &magnitudes, 1, vDSP_Length(halfSize))
                }
            }
        }
        
        var normalized = [Float](repeating: 0.0, count: halfSize)
        var multiplier: Float = 2.0 / Float(fftSize)
        vDSP_vsmul(magnitudes, 1, &multiplier, &normalized, 1, vDSP_Length(halfSize))
        
        var newFftData = [CGFloat]()
        var totalVol: CGFloat = 0.0
        
        for i in 0..<64 {
            let val = normalized[i]
            let scaled = val * 5.0
            let clamped = min(max(scaled * 255.0, 0), 255) / 255.0 
            newFftData.append(CGFloat(clamped))
            totalVol += CGFloat(clamped)
        }
        let avgVol = totalVol / 64.0
        
        let now = Date().timeIntervalSince1970
        Task { @MainActor [weak self] in
            guard let self = self else { return }
            if now - self.lastFftUpdate > 0.033 {
                self.lastFftUpdate = now
                self.fftData = newFftData
                self.averageVolume = avgVol
            }
        }
    }
    
    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime)
    }
    
    private func setupNowPlaying(track: Track) {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = track.title
        nowPlayingInfo[MPMediaItemPropertyArtist] = track.artist
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
}
