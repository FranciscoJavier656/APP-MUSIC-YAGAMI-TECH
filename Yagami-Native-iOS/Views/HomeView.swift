import SwiftUI

struct HomeView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    
                    // Sección Destacada (Hero)
                    VStack(alignment: .leading) {
                        Text("Escuchado Recientemente")
                            .font(.title2).bold()
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(mockLibrary.prefix(3)) { track in
                                    Button {
                                        audioPlayer.play(track: track)
                                    } label: {
                                        VStack(alignment: .leading) {
                                            RoundedRectangle(cornerRadius: 12)
                                                .fill(LinearGradient(colors: track.artworkColors, startPoint: .topLeading, endPoint: .bottomTrailing))
                                                .frame(width: 160, height: 160)
                                                .shadow(radius: 5)
                                            
                                            Text(track.title)
                                                .font(.headline)
                                                .lineLimit(1)
                                                .foregroundColor(.primary)
                                            
                                            Text(track.artist)
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                                .lineLimit(1)
                                        }
                                        .frame(width: 160)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.top, 10)
                    
                    // Lista de Canciones
                    VStack(alignment: .leading) {
                        Text("Para Ti")
                            .font(.title2).bold()
                            .padding(.horizontal)
                        
                        LazyVStack(spacing: 12) {
                            ForEach(mockLibrary) { track in
                                Button {
                                    audioPlayer.play(track: track)
                                } label: {
                                    HStack(spacing: 16) {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(LinearGradient(colors: track.artworkColors, startPoint: .topLeading, endPoint: .bottomTrailing))
                                            .frame(width: 50, height: 50)
                                        
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(track.title)
                                                .font(.headline)
                                                .foregroundColor(.primary)
                                            Text(track.artist)
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "ellipsis")
                                            .foregroundColor(.secondary)
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                    
                    // Espacio para la barra de cristal líquido y el mini player
                    Spacer().frame(height: 180)
                }
            }
            .navigationTitle("Inicio")
            .background(Color(UIColor.systemBackground))
        }
    }
}
