import SwiftUI

struct SearchView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @State private var query = ""
    @State private var isSearching = false
    @State private var results: [QobuzTrack] = []
    
    let bentoGenres = [
        ("Audio Hi-Res", Color.yellow),
        ("Novedades", Color.blue),
        ("Pop", Color.pink),
        ("Hip-Hop", Color.purple),
        ("Electrónica", Color.green),
        ("Rock", Color.red),
        ("Jazz", Color.orange),
        ("Clásica", Color.teal)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(UIColor.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading) {
                        if query.isEmpty {
                            Text("Explorar géneros")
                                .font(.title2).bold()
                                .padding(.horizontal)
                                .padding(.top)
                            
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                ForEach(bentoGenres, id: \.0) { genre in
                                    ZStack(alignment: .bottomLeading) {
                                        genre.1.opacity(0.8)
                                        Text(genre.0)
                                            .font(.headline).bold()
                                            .foregroundColor(.white)
                                            .padding()
                                    }
                                    .frame(height: 100)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 180)
                        } else {
                            if isSearching {
                                ProgressView()
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .padding(.top, 50)
                            } else {
                                LazyVStack(spacing: 0) {
                                    ForEach(results, id: \.id) { track in
                                        Button {
                                            audioPlayer.play(track: Track(from: track))
                                        } label: {
                                            HStack(spacing: 16) {
                                                AsyncImage(url: URL(string: track.album?.image?.small ?? "")) { phase in
                                                    if let image = phase.image {
                                                        image.resizable().scaledToFill()
                                                    } else {
                                                        Rectangle().fill(Color.gray.opacity(0.3))
                                                    }
                                                }
                                                .frame(width: 50, height: 50)
                                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                                
                                                VStack(alignment: .leading, spacing: 4) {
                                                    Text(track.title ?? "")
                                                        .font(.system(size: 16, weight: .semibold))
                                                        .foregroundColor(.primary)
                                                        .lineLimit(1)
                                                    Text(track.performer?.name ?? track.album?.artist?.name ?? "")
                                                        .font(.system(size: 14))
                                                        .foregroundColor(.secondary)
                                                        .lineLimit(1)
                                                }
                                                
                                                Spacer()
                                                
                                                Image(systemName: "ellipsis")
                                                    .foregroundColor(.secondary)
                                            }
                                            .padding(.horizontal)
                                            .padding(.vertical, 8)
                                            .background(Color(UIColor.systemBackground))
                                        }
                                    }
                                }
                                .padding(.bottom, 180)
                            }
                        }
                    }
                }
                .searchable(text: $query, prompt: "Álbumes, artistas, canciones...")
                .onChange(of: query) { newValue in
                    if newValue.isEmpty {
                        results = []
                        isSearching = false
                    } else {
                        performSearch()
                    }
                }
            }
            .navigationTitle("Buscar")
        }
    }
    
    private func performSearch() {
        isSearching = true
        Task {
            do {
                let tracks = try await QobuzAPI.shared.searchTracks(query: query)
                await MainActor.run {
                    self.results = tracks
                    self.isSearching = false
                }
            } catch {
                await MainActor.run {
                    self.isSearching = false
                }
            }
        }
    }
}
