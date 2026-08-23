const fs = require('fs');

let swiftCode = `import Foundation
import Capacitor
import AVFoundation
import Accelerate
import MediaToolbox

@objc(QobuzAudioPlugin)
public class QobuzAudioPlugin: CAPPlugin {
    
    private var player: AVPlayer?
    private var isPlaying = false
    private var lastFftUpdate: TimeInterval = 0
    private var statusObservation: NSKeyValueObservation?
    
    // Configuración FFT de vDSP
    private let fftSize = 1024
    private lazy var log2n = vDSP_Length(log2(Float(fftSize)))
    private lazy var fftSetup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2))
    
    @objc func play(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("URL de stream inválida")
            return
        }
        
        // Blindar sesión de audio para Segundo Plano
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Error configurando AVAudioSession: \\(error)")
        }
        
        let asset = AVURLAsset(url: url)
        let playerItem = AVPlayerItem(asset: asset)
        
        // ---------------------------------------------------------
        // TAP DE PROCESAMIENTO (Intercepta el Buffer HTTP)
        // ---------------------------------------------------------
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
                    let clientInfo = MTAudioProcessingTapGetStorage(tap)
                    let plugin = Unmanaged<QobuzAudioPlugin>.fromOpaque(clientInfo).takeUnretainedValue()
                    
                    // Copiar el buffer crudo a una variable segura para procesar
                    var bufferList = bufferListInOut.pointee
                    plugin.processAudioForFFT(bufferList: &bufferList, frames: numberFrames)
                }
            }
        )
        
        var tap: Unmanaged<MTAudioProcessingTap>?
        let status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &tap)
        
        if status == noErr, let tap = tap {
            // Asincrónicamente cargar los tracks para no bloquear y evitar arreglos vacíos
            asset.loadValuesAsynchronously(forKeys: ["tracks"]) {
                DispatchQueue.main.async {
                    let audioTrack = asset.tracks(withMediaType: .audio).first
                    if let track = audioTrack {
                        let inputParams = AVMutableAudioMixInputParameters(track: track)
                        inputParams.audioTapProcessor = tap.takeRetainedValue()
                        
                        let audioMix = AVMutableAudioMix()
                        audioMix.inputParameters = [inputParams]
                        playerItem.audioMix = audioMix
                    }
                    
                    self.player = AVPlayer(playerItem: playerItem)
                    self.player?.play()
                    self.isPlaying = true
                    
                    // Observar cuando empiece a sonar de verdad (opcional, resolvemos ahora)
                    call.resolve()
                }
            }
        } else {
            // Fallback si no se puede crear el Tap
            self.player = AVPlayer(playerItem: playerItem)
            self.player?.play()
            self.isPlaying = true
            call.resolve()
        }
    }
    
    // ---------------------------------------------------------
    // ANÁLISIS DE ESPECTRO FFT (vDSP Accelerate Framework)
    // ---------------------------------------------------------
    func processAudioForFFT(bufferList: inout AudioBufferList, frames: CMItemCount) {
        guard isPlaying else { return }
        
        let ablPointer = UnsafeMutableAudioBufferListPointer(&bufferList)
        guard let buffer = ablPointer.first?.mData else { return }
        
        let floatPointer = buffer.assumingMemoryBound(to: Float.self)
        var floatArray = [Float](UnsafeBufferPointer(start: floatPointer, count: Int(frames)))
        
        let halfSize = fftSize / 2
        var magnitudes = [Float](repeating: 0.0, count: halfSize)
        var real = [Float](repeating: 0.0, count: halfSize)
        var imag = [Float](repeating: 0.0, count: halfSize)
        
        real.withUnsafeMutableBufferPointer { realPtr in
            imag.withUnsafeMutableBufferPointer { imagPtr in
                var complex = DSPSplitComplex(realp: realPtr.baseAddress!, imagp: imagPtr.baseAddress!)
                
                // Aplicar Ventana de Hann para suavizar los bordes del buffer y evitar ruido
                var window = [Float](repeating: 0, count: Int(frames))
                vDSP_hann_window(&window, vDSP_Length(frames), Int32(vDSP_HANN_NORM))
                
                // Proteccion: Si los frames no coinciden, evitamos crash
                let length = min(frames, CMItemCount(fftSize))
                vDSP_vmul(floatArray, 1, window, 1, &floatArray, 1, vDSP_Length(length))
                
                // Transformar a dominio complejo
                floatArray.withUnsafeBytes { ptr in
                    let boundPtr = ptr.bindMemory(to: DSPComplex.self)
                    vDSP_ctoz(boundPtr.baseAddress!, 2, &complex, 1, vDSP_Length(halfSize))
                }
                
                if let setup = fftSetup {
                    vDSP_fft_zrip(setup, &complex, 1, log2n, FFTDirection(FFT_FORWARD))
                    vDSP_zvmags(&complex, 1, &magnitudes, 1, vDSP_Length(halfSize))
                }
            }
        }
        
        // Normalizar
        var normalized = [Float](repeating: 0.0, count: halfSize)
        var multiplier: Float = 2.0 / Float(fftSize)
        vDSP_vsmul(magnitudes, 1, &multiplier, &normalized, 1, vDSP_Length(halfSize))
        
        // Acortar a 64 barras de frecuencia (optimización visual) y mapear a 0-255
        let result = Array(normalized.prefix(64)).map { val -> Int in
            let scaled = val * 5.0 // Ajuste de ganancia visual
            return Int(min(max(scaled * 255.0, 0), 255))
        }
        
        // Throttle a ~30 FPS para no ahogar el puente de JavaScript
        let now = Date().timeIntervalSince1970
        if now - lastFftUpdate > 0.033 {
            self.lastFftUpdate = now
            DispatchQueue.main.async {
                self.notifyListeners("onFftData", data: ["data": result])
            }
        }
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        player?.pause()
        isPlaying = false
        call.resolve()
    }
    
    @objc func resume(_ call: CAPPluginCall) {
        player?.play()
        isPlaying = true
        call.resolve()
    }
    
    @objc func seek(_ call: CAPPluginCall) {
        guard let time = call.getDouble("time") else { return }
        let targetTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: targetTime)
        call.resolve()
    }
}
`

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.swift', swiftCode);
console.log('Updated QobuzAudioPlugin.swift');
