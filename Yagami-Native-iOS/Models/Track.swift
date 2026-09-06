import Foundation
import SwiftUI

struct Track: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let artist: String
    let artworkColors: [Color]
}

let mockLibrary: [Track] = [
    Track(title: "Déjale Caer To' El Peso", artist: "Hector 'El Father'", artworkColors: [.purple, .black]),
    Track(title: "Gasolina", artist: "Daddy Yankee", artworkColors: [.orange, .red]),
    Track(title: "Danza Kuduro", artist: "Don Omar", artworkColors: [.blue, .cyan]),
    Track(title: "Safaera", artist: "Bad Bunny", artworkColors: [.pink, .purple]),
    Track(title: "Llamado de Emergencia", artist: "Daddy Yankee", artworkColors: [.red, .black]),
    Track(title: "Dile", artist: "Don Omar", artworkColors: [.green, .yellow])
]
