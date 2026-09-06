import SwiftUI

struct DownloadsView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    @StateObject private var downloadManager = DownloadManager.shared
    @State private var filter: String = "all"
    
    var filteredDownloads: [DownloadTaskModel] {
        switch filter {
        case "downloading": return downloadManager.downloads.filter { $0.status == .downloading || $0.status == .queued }
        case "completed": return downloadManager.downloads.filter { $0.status == .completed }
        default: return downloadManager.downloads
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(UIColor.systemBackground).ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Filter picker
                    Picker("Filtro", selection: $filter) {
                        Text("Todos").tag("all")
                        Text("Descargando").tag("downloading")
                        Text("Completados").tag("completed")
                    }
                    .pickerStyle(.segmented)
                    .padding()
                    
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredDownloads) { dl in
                                DownloadRow(download: dl)
                                    .environmentObject(audioPlayer)
                            }
                            
                            if filteredDownloads.isEmpty {
                                VStack(spacing: 12) {
                                    Image(systemName: "arrow.down.circle")
                                        .font(.system(size: 40))
                                        .foregroundColor(.gray.opacity(0.5))
                                    Text("No hay descargas")
                                        .font(.headline)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.top, 40)
                            }
                            
                            Spacer().frame(height: 180)
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .navigationTitle("Descargas")
        }
    }
}

struct DownloadRow: View {
    let download: DownloadTaskModel
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    var body: some View {
        HStack(spacing: 16) {
            AsyncImage(url: download.track.imageUrl) { phase in
                if let image = phase.image {
                    image.resizable().scaledToFill()
                } else {
                    Rectangle().fill(Color.gray.opacity(0.3))
                }
            }
            .frame(width: 50, height: 50)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(download.track.title)
                    .font(.headline)
                    .lineLimit(1)
                Text(download.track.artist)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                
                if download.status == .downloading || download.status == .queued {
                    ProgressView(value: download.progress, total: 1.0)
                        .progressViewStyle(.linear)
                        .tint(.blue)
                }
            }
            
            Spacer()
            
            if download.status == .completed {
                Button {
                    audioPlayer.play(track: download.track)
                } label: {
                    Image(systemName: "play.circle.fill")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
            } else if download.status == .downloading {
                Text("\(Int(download.progress * 100))%")
                    .font(.caption.bold())
                    .foregroundColor(.blue)
            }
            
            Menu {
                Button(role: .destructive) {
                    DownloadManager.shared.deleteDownload(trackId: download.id)
                } label: {
                    Label("Eliminar descarga", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .foregroundColor(.secondary)
                    .padding(8)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
