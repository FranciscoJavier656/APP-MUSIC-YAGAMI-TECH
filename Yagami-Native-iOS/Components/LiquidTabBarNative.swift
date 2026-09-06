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
    
    // Estados para controlar el arrastre fluido
    @State private var dragX: CGFloat? = nil
    @State private var isDragging: Bool = false

    var body: some View {
        GeometryReader { geo in
            let tabWidth = geo.size.width / CGFloat(nativeTabs.count)
            
            ZStack {
                // 1. CONTENEDOR FÍSICO DE CRISTAL
                GlassEffectContainer {
                    ZStack(alignment: .topLeading) {
                        // Base de la barra (Cápsula estática)
                        Capsule()
                            .fill(.clear)
                            .frame(width: geo.size.width, height: 64)
                            .glassEffect(.regular.interactive(), in: Capsule())
                            .glassEffectID("liquid", in: glassNS)

                        // Selector fluido (gota de agua)
                        let activeIndex = nativeTabs.firstIndex(where: { $0.id == activeTab }) ?? 0
                        let exactTabX = (CGFloat(activeIndex) * tabWidth) + (tabWidth / 2)
                        
                        // Si el usuario arrastra, usamos el dedo (dragX). Si no, usamos la posición exacta de la pestaña.
                        let currentX = dragX ?? exactTabX
                        
                        // MAGIA WWDC25: Morfismo de forma
                        // Cuando está estático, es una píldora sutil dentro de la barra.
                        // Cuando se arrastra, se infla como una burbuja redonda y gigante que distorsiona el fondo.
                        let bubbleWidth: CGFloat = isDragging ? 74 : 60
                        let bubbleHeight: CGFloat = isDragging ? 74 : 48
                        let bubbleRadius: CGFloat = isDragging ? 37 : 24
                        
                        RoundedRectangle(cornerRadius: bubbleRadius)
                            .fill(.clear)
                            .frame(width: bubbleWidth, height: bubbleHeight)
                            .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: bubbleRadius))
                            .glassEffectID("liquid", in: glassNS)
                            .position(x: currentX, y: 32)
                            // Animaciones separadas para el movimiento del dedo y la inflación de la burbuja
                            .animation(.interactiveSpring(response: 0.25, dampingFraction: 0.65), value: currentX)
                            .animation(.spring(response: 0.4, dampingFraction: 0.6), value: isDragging)
                    }
                }
                
                // 2. ÍCONOS, TEXTOS Y GESTOS TÁCTILES (Capa inalterable superior)
                HStack(spacing: 0) {
                    ForEach(nativeTabs) { tab in
                        let isActive = tab.id == activeTab
                        
                        VStack(spacing: 3) {
                            Image(systemName: tab.icon)
                                .font(.system(size: isActive ? 24 : 20, weight: isActive ? .semibold : .regular))
                                .symbolEffect(.bounce, value: isActive)
                                .offset(y: isActive ? -12 : 0)
                                .animation(.spring(response: 0.35, dampingFraction: 0.65), value: isActive)
                            
                            if !isActive {
                                Text(tab.label)
                                    .font(.system(size: 10, weight: .medium))
                                    .transition(.opacity)
                            }
                        }
                        .foregroundStyle(isActive ? Color.white : Color.gray)
                        .frame(width: tabWidth, height: 64)
                        .contentShape(Rectangle())
                        // Toque simple
                        .onTapGesture {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.72)) {
                                activeTab = tab.id
                            }
                        }
                    }
                }
                .frame(width: geo.size.width, height: 64)
                // Gesto de arrastre continuo
                .gesture(
                    DragGesture(minimumDistance: 5)
                        .onChanged { value in
                            isDragging = true
                            dragX = value.location.x
                            
                            // Calcula sobre qué pestaña está pasando el dedo para animar los íconos dinámicamente
                            let index = Int(value.location.x / tabWidth)
                            let safeIndex = max(0, min(nativeTabs.count - 1, index))
                            let hoveredTab = nativeTabs[safeIndex].id
                            
                            if hoveredTab != activeTab {
                                withAnimation(.interactiveSpring(response: 0.3, dampingFraction: 0.7)) {
                                    activeTab = hoveredTab
                                }
                            }
                        }
                        .onEnded { value in
                            // Al soltar el dedo, desinflamos la burbuja y la encajamos en la pestaña final
                            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                                isDragging = false
                                dragX = nil
                            }
                        }
                )
            }
        }
        .frame(height: 64)
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
    }
}
