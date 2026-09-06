import SwiftUI

struct StringWrapper: Identifiable {
    let id: String
}

struct HomeView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerModel
    
    @State private var activeSubTab: String = "editorial"
    @State private var activeCategory: String = "Lanzamientos"
    
    @State private var editorPicks: [QobuzAlbum] = []
    @State private var mostStreamed: [QobuzAlbum] = []
    @State private var playlists: [QobuzPlaylist] = []
    
    @State private var isLoading = false
    @State private var categoryLoading = false
    
    @State private var selectedAlbumIdWrapper: StringWrapper?
    @State private var selectedPlaylistIdWrapper: StringWrapper?
    
    let categories = ["Lanzamientos", "Pop", "Jazz", "Clásica", "Electrónica", "Relajación", "Audio Hi-Res"]
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                Color(UIColor.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        // Dummy space for header
                        Spacer().frame(height: 70)
                        
                        if activeSubTab == "editorial" {
                            editorialContent
                        } else {
                            paraTiContent
                        }
                    }
                    .padding(.bottom, 180)
                }
                
                // Sticky Header
                headerView
            }
            .navigationBarHidden(true)
            .task {
                await fetchPlaylists()
                await fetchHomeData()
            }
            .onChange(of: activeCategory) { oldValue, newValue in
                Task {
                    await fetchHomeData()
                }
            }
            .fullScreenCover(item: $selectedAlbumIdWrapper) { wrapper in
                AlbumView(albumId: wrapper.id)
            }
            .fullScreenCover(item: $selectedPlaylistIdWrapper) { wrapper in
                PlaylistView(playlistId: wrapper.id)
            }
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack(spacing: 12) {
            Button {
                // Home icon
            } label: {
                Image(systemName: "house.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.primary)
                    .frame(width: 40, height: 40)
                    .background(Color(UIColor.systemBackground))
                    .clipShape(Circle())
                    .shadow(color: Color.black.opacity(0.05), radius: 3)
                    .overlay(Circle().stroke(Color.gray.opacity(0.2), lineWidth: 1))
            }
            
            Button {
                withAnimation { activeSubTab = "editorial" }
            } label: {
                Text("Selección editorial")
                    .font(.system(size: 15, weight: .semibold))
                    .padding(.horizontal, 20)
                    .frame(height: 40)
                    .background(activeSubTab == "editorial" ? Color.primary : Color.clear)
                    .foregroundColor(activeSubTab == "editorial" ? Color(UIColor.systemBackground) : Color.gray)
                    .clipShape(Capsule())
                    .shadow(color: activeSubTab == "editorial" ? Color.black.opacity(0.1) : Color.clear, radius: 3)
            }
            
            Button {
                withAnimation { activeSubTab = "parati" }
            } label: {
                Text("Para ti")
                    .font(.system(size: 15, weight: .semibold))
                    .padding(.horizontal, 20)
                    .frame(height: 40)
                    .background(activeSubTab == "parati" ? Color.primary : Color.clear)
                    .foregroundColor(activeSubTab == "parati" ? Color(UIColor.systemBackground) : Color.gray)
                    .clipShape(Capsule())
                    .shadow(color: activeSubTab == "parati" ? Color.black.opacity(0.1) : Color.clear, radius: 3)
            }
            
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 56)
        .padding(.bottom, 16)
        .background(.ultraThinMaterial)
    }
    
    // MARK: - Editorial
    private var editorialContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Category Pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(categories, id: \.self) { cat in
                        Button {
                            activeCategory = cat
                        } label: {
                            Text(cat)
                                .font(.system(size: 14, weight: .bold))
                                .padding(.horizontal, 20)
                                .frame(height: 36)
                                .background(activeCategory == cat ? Color.primary : Color.gray.opacity(0.15))
                                .foregroundColor(activeCategory == cat ? Color(UIColor.systemBackground) : Color.primary)
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
            }
            
            if categoryLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
            } else {
                sectionHeader(title: "Álbumes de la semana", subtitle: "Los álbumes más interesantes de la semana.")
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        ForEach(editorPicks.prefix(8), id: \.id) { item in
                            Button {
                                if let id = item.id { selectedAlbumIdWrapper = StringWrapper(id: id) }
                            } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    ZStack(alignment: .bottomLeading) {
                                        AsyncImage(url: URL(string: item.image?.large ?? item.image?.small ?? "")) { phase in
                                            if let image = phase.image {
                                                image.resizable().scaledToFill()
                                            } else {
                                                Rectangle().fill(Color.gray.opacity(0.3))
                                            }
                                        }
                                        .frame(width: 180, height: 180)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                        
                                        // "ÁLBUM DE LA SEMANA" badge
                                        HStack(spacing: 4) {
                                            Image(systemName: "opticaldisc")
                                                .font(.system(size: 10))
                                            Text("ÁLBUM DE LA SEMANA")
                                                .font(.system(size: 10, weight: .black))
                                        }
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color(red: 225/255, green: 83/255, blue: 40/255).opacity(0.9))
                                        .clipShape(RoundedRectangle(cornerRadius: 4))
                                        .padding(12)
                                    }
                                    
                                    HStack(alignment: .top) {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(item.title ?? "")
                                                .font(.system(size: 15, weight: .semibold))
                                                .foregroundColor(.primary)
                                                .lineLimit(1)
                                            
                                            HStack(spacing: 4) {
                                                Text("E")
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(.gray)
                                                    .padding(.horizontal, 4)
                                                    .background(Color.gray.opacity(0.2))
                                                    .cornerRadius(4)
                                                
                                                Text(item.artist?.name ?? "")
                                                    .font(.system(size: 13))
                                                    .foregroundColor(.secondary)
                                                    .lineLimit(1)
                                            }
                                        }
                                        Spacer()
                                    }
                                }
                                .frame(width: 180)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
                
                sectionHeader(title: "Top Álbumes", subtitle: "Álbumes más reproducidos en streaming.")
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        let columns = Int(ceil(Double(mostStreamed.count) / 3.0))
                        ForEach(0..<columns, id: \.self) { colIdx in
                            VStack(spacing: 16) {
                                let startIndex = colIdx * 3
                                let endIndex = min(startIndex + 3, mostStreamed.count)
                                ForEach(startIndex..<endIndex, id: \.self) { rowIdx in
                                    let item = mostStreamed[rowIdx]
                                    let globalIdx = rowIdx + 1
                                    
                                    Button {
                                        if let id = item.id { selectedAlbumIdWrapper = StringWrapper(id: id) }
                                    } label: {
                                        HStack(spacing: 16) {
                                            Text(String(format: "%02d", globalIdx))
                                                .font(.system(size: 32, weight: .black))
                                                .foregroundColor(.gray.opacity(0.3))
                                                .frame(width: 40, alignment: .leading)
                                            
                                            AsyncImage(url: URL(string: item.image?.large ?? item.image?.small ?? "")) { phase in
                                                if let image = phase.image {
                                                    image.resizable().scaledToFill()
                                                } else {
                                                    Rectangle().fill(Color.gray.opacity(0.3))
                                                }
                                            }
                                            .frame(width: 70, height: 70)
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                            
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(item.title ?? "")
                                                    .font(.system(size: 15, weight: .semibold))
                                                    .foregroundColor(.primary)
                                                    .lineLimit(1)
                                                    .multilineTextAlignment(.leading)
                                                
                                                HStack(spacing: 4) {
                                                    Text("E")
                                                        .font(.system(size: 10, weight: .bold))
                                                        .foregroundColor(.gray)
                                                        .padding(.horizontal, 4)
                                                        .background(Color.gray.opacity(0.2))
                                                        .cornerRadius(4)
                                                    
                                                    Text(item.artist?.name ?? "")
                                                        .font(.system(size: 13))
                                                        .foregroundColor(.secondary)
                                                        .lineLimit(1)
                                                        .multilineTextAlignment(.leading)
                                                }
                                            }
                                            Spacer()
                                        }
                                        .frame(width: 300)
                                    }
                                }
                                Spacer(minLength: 0)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
                
                // Playlists que te encantarán
                sectionHeader(title: "Playlists que te encantarán", subtitle: "Selecciones curadas para cada momento.")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        let titlesAndColors = [
                            ("Novedades", [Color(hex: "C43343"), Color(hex: "E35E6D")]),
                            ("Humores", [Color(hex: "D96B2F"), Color(hex: "E58D58")]),
                            ("Relax", [Color(hex: "3381C4"), Color(hex: "5EA1E3")])
                        ]
                        
                        ForEach(0..<titlesAndColors.count, id: \.self) { i in
                            let cat = titlesAndColors[i]
                            let playlistId = (i + 5 < playlists.count) ? playlists[i+5].wrappedId : (playlists.first?.wrappedId ?? "")
                            Button {
                                if !playlistId.isEmpty { selectedPlaylistIdWrapper = StringWrapper(id: playlistId) }
                            } label: {
                                ZStack(alignment: .bottomLeading) {
                                    LinearGradient(colors: cat.1, startPoint: .topLeading, endPoint: .bottomTrailing)
                                        .opacity(0.9)
                                    
                                    Text(cat.0)
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                        .padding(12)
                                }
                                .frame(width: 160, height: 120) // Aspect ratio 4/3 approximately
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
                
                // Karaoke
                sectionHeader(title: "Canta al ritmo de la letra", subtitle: "Vuelve a descubrir tus canciones favoritas con la letra ahora disponible.")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        let karaokeItems = [
                            ("Karaoke - Reggaeton", Color(hex: "B07348"), 3),
                            ("Karaoke - Años 1980", Color(hex: "8F3B55"), 4),
                            ("Karaoke - Pop Español", Color(hex: "B05B7C"), 5)
                        ]
                        
                        ForEach(0..<karaokeItems.count, id: \.self) { i in
                            let k = karaokeItems[i]
                            let playlistId = (k.2 < playlists.count) ? playlists[k.2].wrappedId : (playlists.first?.wrappedId ?? "")
                            
                            Button {
                                if !playlistId.isEmpty { selectedPlaylistIdWrapper = StringWrapper(id: playlistId) }
                            } label: {
                                VStack(alignment: .leading, spacing: 12) {
                                    ZStack {
                                        k.1
                                        Text("KARAOKE")
                                            .font(.system(size: 30, weight: .black))
                                            .italic()
                                            .foregroundColor(.white)
                                            .multilineTextAlignment(.center)
                                    }
                                    .frame(width: 200, height: 200)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(k.0)
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundColor(.primary)
                                            .lineLimit(1)
                                        Text("KARAOKE")
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    
    // MARK: - Para Ti
    private var paraTiContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            sectionHeader(title: "Tu música", subtitle: "Sigue escuchando y descubre más.")
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    // My Weekly Q
                    Button {
                        if let pid = playlists.first?.wrappedId { selectedPlaylistIdWrapper = StringWrapper(id: pid) }
                    } label: {
                        ZStack {
                            LinearGradient(colors: [Color(hex: "4F46E5"), Color(hex: "5B21B6")], startPoint: .topLeading, endPoint: .bottomTrailing)
                                .opacity(0.95)
                            
                            VStack(alignment: .leading) {
                                Image(systemName: "heart.fill")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)
                                    .frame(width: 32, height: 32)
                                    .background(Color.white.opacity(0.2))
                                    .clipShape(Circle())
                                    .padding(.bottom, 8)
                                
                                Text("My Weekly Q")
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.white)
                                
                                Text("Una mezcla basada en tus últimos descubrimientos.")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.8))
                                    .multilineTextAlignment(.leading)
                                
                                Spacer()
                                
                                HStack(spacing: 8) {
                                    Image(systemName: "play.fill")
                                        .font(.system(size: 12))
                                    Text("ESCUCHAR")
                                        .font(.system(size: 12, weight: .semibold))
                                }
                                .foregroundColor(.white)
                            }
                            .padding(20)
                        }
                        .frame(width: 280, height: 157) // 16:9 roughly
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    
                    // Lanzamientos para ti
                    Button {
                        let pid = (playlists.count > 1) ? playlists[1].wrappedId : (playlists.first?.wrappedId ?? "")
                        if !pid.isEmpty { selectedPlaylistIdWrapper = StringWrapper(id: pid) }
                    } label: {
                        ZStack {
                            LinearGradient(colors: [Color(hex: "059669"), Color(hex: "115E59")], startPoint: .topLeading, endPoint: .bottomTrailing)
                                .opacity(0.95)
                            
                            VStack(alignment: .leading) {
                                Image(systemName: "opticaldisc")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)
                                    .frame(width: 32, height: 32)
                                    .background(Color.white.opacity(0.2))
                                    .clipShape(Circle())
                                    .padding(.bottom, 8)
                                
                                Text("Lanzamientos para ti")
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.white)
                                
                                Text("Lo nuevo de los artistas que te gustan.")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.8))
                                    .multilineTextAlignment(.leading)
                                
                                Spacer()
                                
                                HStack(spacing: 8) {
                                    Image(systemName: "play.fill")
                                        .font(.system(size: 12))
                                    Text("ESCUCHAR")
                                        .font(.system(size: 12, weight: .semibold))
                                }
                                .foregroundColor(.white)
                            }
                            .padding(20)
                        }
                        .frame(width: 280, height: 157)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                }
                .padding(.horizontal, 20)
            }
            
            sectionHeader(title: "Mixes basados en tus gustos")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    ForEach(Array(playlists.prefix(5).enumerated()), id: \.element.wrappedId) { idx, item in
                        Button {
                            selectedPlaylistIdWrapper = StringWrapper(id: item.wrappedId)
                        } label: {
                            VStack(alignment: .leading, spacing: 12) {
                                ZStack {
                                    AsyncImage(url: URL(string: item.image?.large ?? item.image?.small ?? "")) { phase in
                                        if let image = phase.image {
                                            image.resizable().scaledToFill()
                                        } else {
                                            Rectangle().fill(Color.gray.opacity(0.3))
                                        }
                                    }
                                    .frame(width: 180, height: 180)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                    
                                    // Overlay play icon logic goes here ideally, skipping for simplicity
                                }
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Mix \(idx + 1)")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.primary)
                                        .lineLimit(1)
                                    Text(item.name ?? "")
                                        .font(.system(size: 13))
                                        .foregroundColor(.gray)
                                        .lineLimit(1)
                                }
                            }
                            .frame(width: 180)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            
            sectionHeader(title: "Artistas similares a lo que escuchas")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    ForEach(mostStreamed.prefix(6), id: \.id) { item in
                        Button {
                            if let id = item.id { selectedAlbumIdWrapper = StringWrapper(id: id) }
                        } label: {
                            VStack(alignment: .center, spacing: 12) {
                                AsyncImage(url: URL(string: item.image?.large ?? item.image?.small ?? "")) { phase in
                                    if let image = phase.image {
                                        image.resizable().scaledToFill()
                                    } else {
                                        Circle().fill(Color.gray.opacity(0.3))
                                    }
                                }
                                .frame(width: 112, height: 112)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(Color.gray.opacity(0.2), lineWidth: 1))
                                
                                Text(item.artist?.name ?? "")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(width: 160)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }
    
    // MARK: - Helpers
    private func sectionHeader(title: String, subtitle: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 28, weight: .black))
                .foregroundColor(.primary)
            
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .padding(.bottom, 20)
    }
    
    // MARK: - Data Fetching
    private func fetchPlaylists() async {
        do {
            let p = try await QobuzAPI.shared.getFeaturedPlaylists()
            await MainActor.run {
                self.playlists = p
            }
        } catch {
            print("Error playlists: \(error)")
        }
    }
    
    private func fetchHomeData() async {
        categoryLoading = true
        var genreId: String? = nil
        var limit = 15
        
        switch activeCategory {
        case "Pop": genreId = "127"
        case "Jazz": genreId = "80"
        case "Clásica": genreId = "10"
        case "Electrónica": genreId = "14"
        case "Relajación": genreId = "94"
        case "Audio Hi-Res": limit = 50
        default: break
        }
        
        do {
            let safeGenreId = genreId
            let safeLimit = limit
            async let ep = QobuzAPI.shared.getFeaturedAlbumsWithGenre(type: "editor-picks", genreId: safeGenreId, limit: safeLimit)
            async let ms = QobuzAPI.shared.getFeaturedAlbumsWithGenre(type: "most-streamed", genreId: safeGenreId, limit: safeLimit)
            
            let (epList, msList) = try await (ep, ms)
            await MainActor.run {
                self.editorPicks = epList
                self.mostStreamed = msList
                self.categoryLoading = false
            }
        } catch {
            print("Error data: \(error)")
            await MainActor.run {
                self.categoryLoading = false
            }
        }
    }
}

// Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
