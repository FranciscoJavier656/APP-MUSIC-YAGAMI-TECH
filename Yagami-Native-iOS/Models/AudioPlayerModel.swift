import Foundation
import AVFoundation
import SwiftUI
import MediaPlayer
import Accelerate
import MediaToolbox

class AudioPlayerModel: ObservableObject {
    @Published var isPlaying = false
    @Published var currentTrack: Track?
    @Published var showFullPlayer = false
    @Published var queue: [Track] = []
    
    // Nativos FFT y Aura
    @Published var fftData: [CGFloat] = Array(repeating: 0, count: 64)
    @Published var averageVolume: CGFloat = 0.0
    
    private var player: AVPlayer?
    private var lastFftUpdate: TimeInterval = 0
    private let fftSize = 1024
    private lazy var log2n = vDSP_Length(log2(Float(fftSize)))
    private lazy var fftSetup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2))

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
                if let streamUrl = try await QobuzAPI.shared.getTrackUrl(trackId: track.id, formatId: 5) {
                    await setupPlayerWithTap(url: streamUrl, track: track)
                }
            } catch {
                print("Error al obtener stream de Qobuz: \(error)")
                DispatchQueue.main.async { self.isPlaying = false }
            }
        }
    }
    
    @MainActor
    private func setupPlayerWithTap(url: URL, track: Track) async {
        let asset = AVURLAsset(url: url)
        let playerItem = AVPlayerItem(asset: asset)
        
        var callbacks = MTAudioProcessingTapCallbacks(
            version: kMTAudioProcessingTapCallbacksVersion_0,
            clientInfo: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
            `init`: { tap, clientInfo, tapStorageOut in
                tapStorageOut.pointee = clientInfo
            },
            finalize: { tap in },
            prepare: { tap, maxFrames, processingFormat in },
            unprepare: { tap in },
            process: { tap, numberFrames, flags, bufferListInOut, numberFramesOut, flagsOut in
                let status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, nil, numberFramesOut)
                if status == noErr {
                    if let storage = MTAudioProcessingTapGetStorage(tap) {
                        let plugin = Unmanaged<AudioPlayerModel>.fromOpaque(storage).takeUnretainedValue()
                        plugin.processAudioForFFT(bufferList: bufferListInOut, frames: numberFrames)
                    }
                }
            }
        )
        
        var tap: MTAudioProcessingTap?
        let status = MTAudioProcessingTapCreate(
            kCFAllocatorDefault,
            &callbacks,
            MTAudioProcessingTapCreationFlags.postEffects,
            &tap
        )
        
        // Cargar tracks asíncronamente
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
        self.player?.play()
        self.isPlaying = true
        self.setupNowPlaying(track: track)
    }
    
    func processAudioForFFT(bufferList: UnsafeMutablePointer<AudioBufferList>, frames: CMItemCount) {
        guard isPlaying else { return }
        
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
                
                if let setup = fftSetup {
                    vDSP_fft_zrip(setup, &complex, 1, log2n, FFTDirection(FFT_FORWARD))
                    vDSP_zvmags(&complex, 1, &magnitudes, 1, vDSP_Length(halfSize))
                }
            }
        }
        
        var normalized = [Float](repeating: 0.0, count: halfSize)
        var multiplier: Float = 2.0 / Float(fftSize)
        vDSP_vsmul(magnitudes, 1, &multiplier, &normalized, 1, vDSP_Length(halfSize))
        
        // Procesamos los primeros 64 bins para visualizador
        var newFftData = [CGFloat]()
        var totalVol: CGFloat = 0.0
        
        for i in 0..<64 {
            let val = normalized[i]
            let scaled = val * 5.0
            let clamped = min(max(scaled * 255.0, 0), 255) / 255.0 // Valor entre 0 y 1
            newFftData.append(CGFloat(clamped))
            totalVol += CGFloat(clamped)
        }
        let avgVol = totalVol / 64.0
        
        let now = Date().timeIntervalSince1970
        // Actualizamos UI a ~30fps
        if now - lastFftUpdate > 0.033 {
            self.lastFftUpdate = now
            DispatchQueue.main.async {
                self.fftData = newFftData
                self.averageVolume = avgVol
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
