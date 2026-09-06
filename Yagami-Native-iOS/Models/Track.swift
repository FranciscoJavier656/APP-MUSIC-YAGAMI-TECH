import Foundation

struct Track: Identifiable, Equatable {
    let id: Int
    let title: String
    let artist: String
    let imageUrl: URL?
    let duration: Int
    
    init(id: Int, title: String, artist: String, imageUrl: URL?, duration: Int = 0) {
        self.id = id
        self.title = title
        self.artist = artist
        self.imageUrl = imageUrl
        self.duration = duration
    }
    
    init(from qobuzTrack: QobuzTrack) {
        self.id = qobuzTrack.id ?? 0
        self.title = qobuzTrack.title ?? "Unknown Track"
        self.artist = qobuzTrack.performer?.name ?? "Unknown Artist"
        if let imgString = qobuzTrack.album?.image?.extralarge ?? qobuzTrack.album?.image?.large {
            self.imageUrl = URL(string: imgString)
        } else {
            self.imageUrl = nil
        }
        self.duration = qobuzTrack.duration ?? 0
    }
    
    static func == (lhs: Track, rhs: Track) -> Bool {
        return lhs.id == rhs.id
    }
}
