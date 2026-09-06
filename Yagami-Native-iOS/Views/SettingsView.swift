import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Cuenta")) {
                    HStack {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                        VStack(alignment: .leading) {
                            Text("Usuario")
                                .font(.headline)
                            Text("Suscripción activa")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section(header: Text("Calidad de audio")) {
                    HStack {
                        Text("Streaming")
                        Spacer()
                        Text("Hi-Res Lossless")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Descargas")
                        Spacer()
                        Text("FLAC 16-Bit")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section(header: Text("Descargas")) {
                    Toggle("Descargar solo con Wi-Fi", isOn: .constant(true))
                }
                
                Section(header: Text("Acerca de")) {
                    HStack {
                        Text("Versión")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Ajustes")
            // Padding so miniplayer doesn't cover the last elements
            .safeAreaInset(edge: .bottom) {
                Spacer().frame(height: 80)
            }
        }
    }
}
