import Foundation

struct QobuzFeaturedAlbumsResponse: Codable {
    let albums: QobuzAlbumsList?
}

struct QobuzAlbumsList: Codable {
    let items: [QobuzAlbum]?
}

struct QobuzAlbum: Codable {
    let id: String?
    let title: String?
    let artist: QobuzArtist?
    let image: QobuzImage?
}

struct QobuzArtist: Codable {
    let id: Int?
    let name: String?
}

struct QobuzImage: Codable {
    let small: String?
    let thumbnail: String?
    let large: String?
    let extralarge: String?
    let back: String?
}

struct QobuzTrack: Codable {
    let id: Int?
    let title: String?
    let duration: Int?
    let performer: QobuzArtist?
    let album: QobuzAlbum?
}

struct QobuzStreamResponse: Codable {
    let track_id: Int?
    let url: String?
    let format_id: Int?
    let mime_type: String?
}
