import SwiftUI
@available(iOS 18.0, *)
struct TestView: View {
    var body: some View {
        TabView {
            Text("Test")
                .tabItem { Text("Test") }
        }
        .safeAreaInset(edge: .bottom) {
            Text("Miniplayer")
        }
    }
}
