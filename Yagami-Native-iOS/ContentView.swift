import SwiftUI

struct ContentView: View {
    @State private var activeTab: String = "home"
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        ZStack(alignment: .bottom) {
            // VISTAS PRINCIPALES
            Group {
                switch activeTab {
                case "home":
                    HomeView()
                case "search":
                    Text("Buscar").frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.black)
                case "library":
                    Text("Librería").frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.black)
                case "downloads":
                    Text("Descargas").frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.black)
                case "settings":
                    Text("Ajustes").frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.black)
                default:
                    HomeView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            // MINI REPRODUCTOR Y BARRA DE NAVEGACIÓN
            VStack(spacing: 12) {
                // Mini reproductor flotante
                MiniPlayerNative()
                    .padding(.horizontal, 16)
                
                // Barra de cristal líquido
                if #available(iOS 26.0, *) {
                    LiquidTabBarNative(activeTab: $activeTab)
                } else {
                    Text("Requiere iOS 26 para Liquid Glass")
                }
            }
            .padding(.bottom, 12) // Separación adicional del borde de la pantalla
        }
        .ignoresSafeArea(.keyboard)
        .fullScreenCover(isPresented: $audioPlayer.showFullPlayer) {
            PlayerView()
        }
    }
}
