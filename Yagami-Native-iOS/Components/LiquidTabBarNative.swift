import SwiftUI

struct TabItem: Identifiable {
    let id: String
    let icon: String
    let label: String
}

let nativeTabs: [TabItem] = [
    TabItem(id: "home", icon: "house.fill", label: "Inicio"),
    TabItem(id: "search", icon: "magnifyingglass", label: "Buscar"),
    TabItem(id: "library", icon: "square.stack.fill", label: "Librería"),
    TabItem(id: "downloads", icon: "arrow.down.circle.fill", label: "Descargas"),
    TabItem(id: "settings", icon: "gearshape.fill", label: "Ajustes")
]

@available(iOS 26, *)
struct LiquidTabBarNative: View {
    @Binding var activeTab: String
    @Namespace private var glassNS
    @Namespace private var bubbleNS

    var body: some View {
        // AQUÍ ESTÁ EL CÓDIGO WWDC25 DE LIQUID GLASS 100% NATIVO
        GlassEffectContainer {
            ZStack(alignment: .bottom) {
                // 1. CÁPSULA BASE
                Capsule()
                    .fill(.clear)
                    .frame(height: 64)
                    .glassEffect(.regular.interactive(), in: Capsule())
                    .glassEffectID("liquid", in: glassNS)

                // 2. BURBUJA ACTIVA QUE SE FUSIONA
                HStack(spacing: 0) {
                    ForEach(nativeTabs) { tab in
                        Color.clear
                            .frame(maxWidth: .infinity)
                            .overlay(alignment: .bottom) {
                                if tab.id == activeTab {
                                    Circle()
                                        .frame(width: 60, height: 60)
                                        .glassEffect(.regular.interactive(), in: Circle())
                                        .glassEffectID("liquid", in: glassNS)
                                        .matchedGeometryEffect(id: "bubble", in: bubbleNS)
                                        .offset(y: -10)
                                }
                            }
                    }
                }
                .frame(height: 64)

                // 3. ÍCONOS (Separados del cristal para no deformarse)
                HStack(spacing: 0) {
                    ForEach(nativeTabs) { tab in
                        let isActive = tab.id == activeTab
                        Button {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.72)) {
                                activeTab = tab.id
                            }
                        } label: {
                            VStack(spacing: 3) {
                                Image(systemName: tab.icon)
                                    .font(.system(size: isActive ? 23 : 20, weight: isActive ? .semibold : .regular))
                                    .symbolEffect(.bounce, value: isActive)
                                    .offset(y: isActive ? -8 : 0)
                                Text(tab.label)
                                    .font(.system(size: 10, weight: isActive ? .bold : .medium))
                            }
                            .foregroundStyle(isActive ? Color.white : Color(UIColor.lightGray))
                            .frame(maxWidth: .infinity)
                            .frame(height: 64)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .frame(height: 64)
            }
        }
        .padding(.horizontal, 16)
        // El safe area inferior de iOS mantendrá la barra en su lugar
    }
}
