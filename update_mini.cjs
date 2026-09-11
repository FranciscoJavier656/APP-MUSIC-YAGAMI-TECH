const fs = require('fs');
let code = fs.readFileSync('Yagami-Native-iOS/Components/MiniPlayerNative.swift', 'utf8');

const oldCode = `                        HStack(alignment: .bottom, spacing: 2) {
                            ForEach(24..<40, id: \\.self) { index in
                                let val = audioPlayer.fftData.indices.contains(index) ? audioPlayer.fftData[index] : 0
                                let height = max(2, val * 20)
                                RoundedRectangle(cornerRadius: 1)
                                    .fill(Color.primary.opacity(0.8))
                                    .frame(width: 2, height: height)
                                    .animation(.linear(duration: 0.05), value: val)
                            }
                        }
                        .frame(height: 24, alignment: .center)`;

const newCode = `                        // Mini Visualizador usando Native Canvas API (Performance)
                        Canvas { context, size in
                            let startIndex = 24
                            let barCount = 16
                            let spacing: CGFloat = 2
                            let totalSpacing = spacing * CGFloat(barCount - 1)
                            let barWidth = (size.width - totalSpacing) / CGFloat(barCount)
                            
                            for i in 0..<barCount {
                                let index = startIndex + i
                                let val = audioPlayer.fftData.indices.contains(index) ? audioPlayer.fftData[index] : 0
                                let height = max(2, val * 20)
                                let x = CGFloat(i) * (barWidth + spacing)
                                let y = size.height - height
                                
                                let rect = CGRect(x: x, y: y, width: barWidth, height: height)
                                let path = Path(roundedRect: rect, cornerRadius: 1)
                                
                                context.fill(path, with: .color(Color.primary.opacity(0.8)))
                            }
                        }
                        .frame(width: 60, height: 24, alignment: .center)`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('Yagami-Native-iOS/Components/MiniPlayerNative.swift', code);
