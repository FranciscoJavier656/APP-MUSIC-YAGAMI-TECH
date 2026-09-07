const fs = require('fs');
const f = 'Yagami-Native-iOS/ContentView.swift';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/if #available\(iOS 26\.0, \*\) \{[\s\S]*?\} else \{[\s\S]*?\}/, `
        ZStack(alignment: .bottom) {
            TabView(selection: $activeTab) {
                HomeView()
                    .tabItem {
                        Image(systemName: "house.fill")
                        Text("Inicio")
                    }
                    .tag("home")
                    
                SearchView()
                    .tabItem {
                        Image(systemName: "magnifyingglass")
                        Text("Buscar")
                    }
                    .tag("search")
                    
                LibraryView()
                    .tabItem {
                        Image(systemName: "square.stack.fill")
                        Text("Librería")
                    }
                    .tag("library")
                    
                DownloadsView()
                    .tabItem {
                        Image(systemName: "arrow.down.circle.fill")
                        Text("Descargas")
                    }
                    .tag("downloads")
                    
                SettingsView()
                    .tabItem {
                        Image(systemName: "gearshape.fill")
                        Text("Ajustes")
                    }
                    .tag("settings")
            }
            .safeAreaInset(edge: .bottom) {
                MiniPlayerNative()
                    .padding(.horizontal, 16)
                    .padding(.bottom, 60) // Extra padding to sit above the standard tab bar
            }
            .ignoresSafeArea(.keyboard)
            .fullScreenCover(isPresented: $audioPlayer.showFullPlayer) {
                PlayerView()
            }
        }
`);
fs.writeFileSync(f, c);
