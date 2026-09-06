import re
with open("Yagami-Native-iOS/Views/PlayerView.swift", "r") as f:
    content = f.read()
content = content.replace('Button { } label: { \n                                Image(systemName: "arrow.down")', 'Button { DownloadManager.shared.startDownload(track: track) } label: { \n                                Image(systemName: "arrow.down")')
with open("Yagami-Native-iOS/Views/PlayerView.swift", "w") as f:
    f.write(content)
