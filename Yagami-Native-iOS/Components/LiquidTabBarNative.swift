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
        GlassEffectContainer {
            ZStack(alignment: .bottom) {
                // 1. CÁPSULA BASE
                Capsule()
                    .fill(.clear)
                    .frame(height: 64)
                    .glassEffect(.regular.interactive(), in: Capsule())
                    .glassEffectID("liquid", in: glassNS)

                // 2. BURBUJA ACTIVA (EL SELECTOR PERFECTO ESTILO APPLE)
                HStack(spacing: 0) {
                    ForEach(nativeTabs) { tab in
                        Color.clear
                            .frame(maxWidth: .infinity)
                            .overlay(alignment: .bottom) {
                                if tab.id == activeTab {
                                    // Cambiamos Circle() por una cápsula ligeramente más ancha y alta
                                    // Esta es la forma exacta que usan en el proyecto Landmarks
                                    Capsule()
                                        .frame(width: 68, height: 74)
                                        .glassEffect(.regular.interactive(), in: Capsule())
                                        .glassEffectID("liquid", in: glassNS)
                                        .matchedGeometryEffect(id: "bubble", in: bubbleNS)
                                        .offset(y: -4) // Lo bajamos un poco para que se fusione mejor con la base
                                }
                            }
                    }
                }
                .frame(height: 64)
            }
        }
        // 3. ÍCONOS Y TÍTULOS (En el overlay)
        .overlay(alignment: .bottom) {
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
                                .font(.system(size: isActive ? 24 : 20, weight: isActive ? .semibold : .regular))
                                .symbolEffect(.bounce, value: isActive)
                                // Ajustamos el offset vertical del ícono activo para que encaje perfecto en la burbuja
                                .offset(y: isActive ? -12 : 0)
                            
                            // Ocultamos el texto si la pestaña está activa, 
                            // exactamente como lo hace Apple en la nueva interfaz.
                            if !isActive {
                                Text(tab.label)
                                    .font(.system(size: 10, weight: .medium))
                            }
                        }
                        .foregroundStyle(isActive ? Color.white : Color.gray)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .frame(height: 64)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
    }
}
