import SwiftUI

struct LibraryView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(UIColor.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        
                        HStack(spacing: 20) {
                            LibraryCard(title: "Playlists", icon: "music.note.list", color: .purple)
                            LibraryCard(title: "Álbumes", icon: "square.stack", color: .blue)
                        }
                        .padding(.horizontal)
                        .padding(.top)
                        
                        HStack(spacing: 20) {
                            LibraryCard(title: "Artistas", icon: "person.2.fill", color: .orange)
                            LibraryCard(title: "Descargas", icon: "arrow.down.circle.fill", color: .green)
                        }
                        .padding(.horizontal)
                        
                        Text("Añadido recientemente")
                            .font(.title3).bold()
                            .padding(.horizontal)
                            .padding(.top, 10)
                        
                        // Empty state for library
                        VStack(spacing: 12) {
                            Image(systemName: "music.note")
                                .font(.system(size: 40))
                                .foregroundColor(.gray.opacity(0.5))
                            Text("Tu biblioteca está vacía")
                                .font(.headline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                        
                        Spacer().frame(height: 180)
                    }
                }
            }
            .navigationTitle("Librería")
        }
    }
}

struct LibraryCard: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)
                .padding(.bottom, 8)
            Text(title)
                .font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.gray.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
