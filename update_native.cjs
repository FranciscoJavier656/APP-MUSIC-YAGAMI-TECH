const fs = require('fs');
let code = fs.readFileSync('Yagami-Native-iOS/Views/PlayerView.swift', 'utf8');

const oldCode = `                    HStack(alignment: .bottom, spacing: 3) {
                        ForEach(0..<64, id: \\.self) { index in
                            let val = audioPlayer.fftData.indices.contains(index) ? audioPlayer.fftData[index] : 0
                            let height = max(4, val * 60)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(audioPlayer.artworkColor)
                                .opacity(0.3 + Double(val) * 0.7) // Brighter on peak
                                .frame(width: 3, height: height)
                                .animation(.linear(duration: 0.05), value: val)
                        }
                    }
                    .frame(height: 60, alignment: .bottom)
                    .padding(.horizontal, 32)
                    .padding(.top, 16)`;

const newCode = `                    // 4. NATIVE CANVAS FFT VISUALIZER (Exact HTML5 Canvas Replication)
                    Canvas { context, size in
                        let barCount = 64
                        let spacing: CGFloat = 3
                        let totalSpacing = spacing * CGFloat(barCount - 1)
                        let barWidth = (size.width - totalSpacing) / CGFloat(barCount)
                        
                        for index in 0..<barCount {
                            let val = audioPlayer.fftData.indices.contains(index) ? audioPlayer.fftData[index] : 0
                            let height = max(4, val * 60)
                            let x = CGFloat(index) * (barWidth + spacing)
                            let y = size.height - height
                            
                            let rect = CGRect(x: x, y: y, width: barWidth, height: height)
                            let path = Path(roundedRect: rect, cornerRadius: 2)
                            
                            let opacity = 0.3 + Double(val * 0.7)
                            context.fill(path, with: .color(audioPlayer.artworkColor.opacity(opacity)))
                        }
                    }
                    .frame(height: 60)
                    .padding(.horizontal, 32)
                    .padding(.top, 16)`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('Yagami-Native-iOS/Views/PlayerView.swift', code);
