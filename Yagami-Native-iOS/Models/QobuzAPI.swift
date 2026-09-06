import Foundation
import CryptoKit

struct Config {
    static let appId = "798273057"
    static let appSecret = "abb21364945c0583309667d13ca3d93a"
    static let userToken = "bewXiqH7uovwSCIST4QzLtE6LWnJ8oS_-8KmvvYmqx2NzlwAzo7rbw_Z5BFZg2c6r8CGN0R0br6mu86gO3ti6A"
    static let baseURL = "https://www.qobuz.com/api.json/0.2/"
}

class QobuzAPI {
    static let shared = QobuzAPI()
    
    private func getHeaders() -> [String: String] {
        return [
            "x-app-id": Config.appId,
            "x-user-auth-token": Config.userToken
        ]
    }
    
    func md5(_ string: String) -> String {
        let digest = Insecure.MD5.hash(data: string.data(using: .utf8) ?? Data())
        return digest.map { String(format: "%02hhx", $0) }.joined()
    }
    
    func getTrackUrl(trackId: Int, formatId: Int = 5) async throws -> URL? {
        let timestamp = Int(Date().timeIntervalSince1970)
        let r_sig = "trackgetFileUrlformat_id\(formatId)intentstreamtrack_id\(trackId)\(timestamp)\(Config.appSecret)"
        let r_sig_hashed = md5(r_sig)
        
        guard var components = URLComponents(string: Config.baseURL + "track/getFileUrl") else { return nil }
        components.queryItems = [
            URLQueryItem(name: "format_id", value: "\(formatId)"),
            URLQueryItem(name: "intent", value: "stream"),
            URLQueryItem(name: "track_id", value: "\(trackId)"),
            URLQueryItem(name: "request_ts", value: "\(timestamp)"),
            URLQueryItem(name: "request_sig", value: r_sig_hashed)
        ]
        
        guard let url = components.url else { return nil }
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let json = try JSONDecoder().decode(QobuzStreamResponse.self, from: data)
        if let urlString = json.url {
            return URL(string: urlString)
        }
        return nil
    }
    
    func getFeaturedAlbums(type: String = "new-releases") async throws -> [QobuzAlbum] {
        guard var components = URLComponents(string: Config.baseURL + "album/getFeatured") else { return [] }
        components.queryItems = [
            URLQueryItem(name: "type", value: type),
            URLQueryItem(name: "limit", value: "15")
        ]
        guard let url = components.url else { return [] }
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let json = try JSONDecoder().decode(QobuzFeaturedAlbumsResponse.self, from: data)
        return json.albums?.items ?? []
    }
    
    func searchTracks(query: String) async throws -> [QobuzTrack] {
        guard var components = URLComponents(string: Config.baseURL + "track/search") else { return [] }
        components.queryItems = [
            URLQueryItem(name: "query", value: query),
            URLQueryItem(name: "limit", value: "20")
        ]
        guard let url = components.url else { return [] }
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, _) = try await URLSession.shared.data(for: request)
        // Basic search response parsing... wait let's define struct
        struct SearchResponse: Codable {
            let tracks: TracksData?
            struct TracksData: Codable {
                let items: [QobuzTrack]?
            }
        }
        let json = try JSONDecoder().decode(SearchResponse.self, from: data)
        return json.tracks?.items ?? []
    }
}
