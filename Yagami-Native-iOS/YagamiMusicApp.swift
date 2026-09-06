import SwiftUI

@main
struct YagamiMusicApp: App {
    // Inyectamos el gestor de audio globalmente
    @StateObject private var audioPlayer = AudioPlayerModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(audioPlayer)
                // Fuerzo el modo oscuro por defecto si así es tu diseño
                .preferredColorScheme(.dark)
        }
    }
}
