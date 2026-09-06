import SwiftUI

struct HomeView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @State private var featuredTracks: [Track] = []
    @State private var recentTracks: [Track] = []
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    
                    // Sección Destacada
                    VStack(alignment: .leading) {
                        Text("Tendencias (Qobuz)")
                            .font(.title2).bold()
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(recentTracks) { track in
                                    Button {
                                        audioPlayer.play(track: track)
                                    } label: {
                                        VStack(alignment: .leading) {
                                            AsyncImage(url: track.imageUrl) { phase in
                                                if let image = phase.image {
                                                    image.resizable().scaledToFill()
                                                } else {
                                                    Rectangle().fill(Color.gray.opacity(0.3))
                                                }
                                            }
                                            .frame(width: 160, height: 160)
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
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
                            ForEach(featuredTracks) { track in
                                Button {
                                    audioPlayer.play(track: track)
                                } label: {
                                    HStack(spacing: 16) {
                                        AsyncImage(url: track.imageUrl) { phase in
                                            if let image = phase.image {
                                                image.resizable().scaledToFill()
                                            } else {
                                                Rectangle().fill(Color.gray.opacity(0.3))
                                            }
                                        }
                                        .frame(width: 50, height: 50)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                        
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(track.title)
                                                .font(.headline)
                                                .foregroundColor(.primary)
                                                .lineLimit(1)
                                            Text(track.artist)
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                                .lineLimit(1)
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
                    
                    Spacer().frame(height: 180)
                }
            }
            .navigationTitle("Inicio")
            .background(Color(UIColor.systemBackground))
            .task {
                await loadFeatured()
            }
        }
    }
    
    func loadFeatured() async {
        do {
            let tracks = try await QobuzAPI.shared.searchTracks(query: "Top 2024")
            self.featuredTracks = tracks.map { Track(from: $0) }
            
            let recent = try await QobuzAPI.shared.searchTracks(query: "Reggaeton")
            self.recentTracks = recent.map { Track(from: $0) }
            
        } catch {
            print("Error cargando home desde Qobuz: \(error)")
        }
    }
}
