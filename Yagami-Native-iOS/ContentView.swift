import SwiftUI

struct ContentView: View {
    @State private var activeTab: String = "home"
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        if #available(iOS 26.0, *) {
            // El TabView nativo de iOS 26 maneja todo el Liquid Glass y los gestos automáticamente
            TabView(selection: $activeTab) {
                Tab("Inicio", systemImage: "house.fill", value: "home") {
                    HomeView()
                }
                
                Tab("Buscar", systemImage: "magnifyingglass", value: "search") {
                    Text("Buscar")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black)
                }
                
                Tab("Librería", systemImage: "square.stack.fill", value: "library") {
                    Text("Librería")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black)
                }
                
                Tab("Descargas", systemImage: "arrow.down.circle.fill", value: "downloads") {
                    Text("Descargas")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black)
                }
                
                Tab("Ajustes", systemImage: "gearshape.fill", value: "settings") {
                    Text("Ajustes")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black)
                }
            }
            // API oficial de Landmarks WWDC25 para integrar el reproductor a la barra
            .tabViewBottomAccessory {
                MiniPlayerNative()
                    .padding(.horizontal, 16)
                    // Pequeño ajuste para que no quede pegado a la barra
                    .padding(.bottom, 8) 
            }
            // Opcional: minimiza la barra al hacer scroll
            .tabBarMinimizeBehavior(.onScrollDown)
            .ignoresSafeArea(.keyboard)
            .fullScreenCover(isPresented: $audioPlayer.showFullPlayer) {
                PlayerView()
            }
        } else {
            // Fallback para versiones anteriores
            Text("Requiere iOS 26 para la nueva experiencia")
        }
    }
}
