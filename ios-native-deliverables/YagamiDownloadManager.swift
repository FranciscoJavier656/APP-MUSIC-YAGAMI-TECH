import Foundation
import Capacitor
import AVFoundation

@objc(YagamiDownloadManager)
public class YagamiDownloadManager: CAPPlugin, URLSessionDownloadDelegate {
    
    private var downloadSession: URLSession!
    private var activeDownloads: [Int: String] = [:] // TaskID -> TrackID
    
    override public func load() {
        let config = URLSessionConfiguration.background(withIdentifier: "com.yagami.downloadmanager.background")
        config.isDiscretionary = false
        config.sessionSendsLaunchEvents = true
        self.downloadSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }
    
    @objc func downloadTrack(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString),
              let trackId = call.getString("trackId") else {
            call.reject("Must provide url and trackId")
            return
        }
        
        let format = call.getString("format") ?? "flac"
        let downloadTask = downloadSession.downloadTask(with: url)
        
        // Save metadata temporarily in task description to embed it later
        let metadata = [
            "title": call.getString("title") ?? "Unknown",
            "artist": call.getString("artist") ?? "Unknown",
            "album": call.getString("album") ?? "Unknown",
            "artworkUrl": call.getString("artworkUrl") ?? "",
            "trackId": trackId,
            "format": format
        ]
        
        if let metadataData = try? JSONSerialization.data(withJSONObject: metadata),
           let metadataString = String(data: metadataData, encoding: .utf8) {
            downloadTask.taskDescription = metadataString
        }
        
        activeDownloads[downloadTask.taskIdentifier] = trackId
        downloadTask.resume()
        
        // Notify React that download started
        self.notifyListeners("onDownloadStarted", data: ["trackId": trackId])
        
        call.resolve([
            "status": "queued",
            "trackId": trackId
        ])
    }
    
    // MARK: - URLSessionDownloadDelegate
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        
        let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        guard let trackId = activeDownloads[downloadTask.taskIdentifier] else { return }
        
        // Notify React (Capacitor) about progress
        self.notifyListeners("onDownloadProgress", data: [
            "trackId": trackId,
            "progress": progress
        ])
    }
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let description = downloadTask.taskDescription,
              let data = description.data(using: .utf8),
              let metadata = try? JSONSerialization.jsonObject(with: data) as? [String: String],
              let trackId = metadata["trackId"],
              let format = metadata["format"] else { return }
              
        let fileManager = FileManager.default
        let appSupportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let downloadsDir = appSupportDir.appendingPathComponent("Downloads")
        
        if !fileManager.fileExists(atPath: downloadsDir.path) {
            try? fileManager.createDirectory(at: downloadsDir, withIntermediateDirectories: true)
        }
        
        let destinationURL = downloadsDir.appendingPathComponent("\(trackId).\(format)")
        
        do {
            if fileManager.fileExists(atPath: destinationURL.path) {
                try fileManager.removeItem(at: destinationURL)
            }
            try fileManager.moveItem(at: location, to: destinationURL)
            
            // TODO: Inyectar metadatos usando AVAssetExportSession o librerías de C para FLAC
            // processMetadata(for: destinationURL, with: metadata)
            
            self.notifyListeners("onDownloadCompleted", data: [
                "trackId": trackId,
                "path": destinationURL.path
            ])
            
        } catch {
            self.notifyListeners("onDownloadError", data: [
                "trackId": trackId,
                "error": error.localizedDescription
            ])
        }
        
        activeDownloads.removeValue(forKey: downloadTask.taskIdentifier)
    }
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            if let trackId = activeDownloads[task.taskIdentifier] {
                self.notifyListeners("onDownloadError", data: [
                    "trackId": trackId,
                    "error": error.localizedDescription
                ])
                activeDownloads.removeValue(forKey: task.taskIdentifier)
            }
        }
    }
}
