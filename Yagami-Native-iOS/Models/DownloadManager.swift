import Foundation
import SwiftUI
import Combine

enum DownloadStatus: String, Codable {
    case queued
    case downloading
    case completed
    case error
}

struct DownloadTaskModel: Identifiable, Codable {
    var id: String { track.id }
    let track: Track
    var progress: Double
    var status: DownloadStatus
    var localPath: String?
}

@MainActor
class DownloadManager: ObservableObject {
    static let shared = DownloadManager()
    
    @Published var downloads: [DownloadTaskModel] = []
    
    private let userDefaultsKey = "YagamiOfflineTracks"
    
    init() {
        loadOfflineTracks()
    }
    
    func startDownload(track: Track) {
        if downloads.contains(where: { $0.id == track.id }) { return }
        
        let newTask = DownloadTaskModel(track: track, progress: 0.0, status: .queued)
        downloads.append(newTask)
        
        // Simular descarga por ahora, en un app real usaríamos URLSessionDownloadTask
        simulateDownload(for: track)
    }
    
    private func simulateDownload(for track: Track) {
        // Encontramos el index
        guard let index = downloads.firstIndex(where: { $0.id == track.id }) else { return }
        downloads[index].status = .downloading
        
        var currentProgress: Double = 0.0
        
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            currentProgress += Double.random(in: 0.02...0.1)
            
            Task { @MainActor in
                if let idx = self.downloads.firstIndex(where: { $0.id == track.id }) {
                    if currentProgress >= 1.0 {
                        self.downloads[idx].progress = 1.0
                        self.downloads[idx].status = .completed
                        self.downloads[idx].localPath = "file://simulated/\(track.id).flac"
                        self.saveOfflineTracks()
                        timer.invalidate()
                    } else {
                        self.downloads[idx].progress = currentProgress
                    }
                } else {
                    timer.invalidate()
                }
            }
        }
    }
    
    func deleteDownload(trackId: String) {
        downloads.removeAll { $0.id == trackId }
        saveOfflineTracks()
    }
    
    private func saveOfflineTracks() {
        let completed = downloads.filter { $0.status == .completed }
        if let encoded = try? JSONEncoder().encode(completed) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }
    
    private func loadOfflineTracks() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let saved = try? JSONDecoder().decode([DownloadTaskModel].self, from: data) {
            self.downloads = saved
        }
    }
}
