const fs = require('fs');
const f = 'src/components/ExpandedPlayer.tsx';
let c = fs.readFileSync(f, 'utf8');

const returnRegex = /return \(\s*<AnimatePresence>[\s\S]*?\);\n\}/;

const newReturn = `return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: touchOffsetY > 0 ? touchOffsetY : 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[60] bg-black flex flex-col overflow-hidden"
        >
          {/* Aura Background */}
          {dominantColor && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] max-w-[1200px] max-h-[1200px] pointer-events-none mix-blend-screen"
              style={{
                background: \`radial-gradient(50% 50% at 50% 0%, \${dominantColor}73 0%, transparent 100%)\`,
              }}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),40px)] pb-4 sm:pb-8 relative z-10">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-11 h-11 flex items-center justify-center text-white"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-white/40 tracking-[0.15em]">
                REPRODUCIENDO DESDE
              </span>
              <span className="text-[13px] font-semibold text-white/80 tracking-[0.2em] mt-0.5">
                QOBUZ
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setContextMenuTrack({ item: currentTrack, type: 'track' }); }}
                className="w-11 h-11 flex items-center justify-center text-white"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowQueue(true)}
                className="w-11 h-11 flex items-center justify-center text-white"
              >
                <ListMusic className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-0 relative z-10 w-full">
            {/* Artwork */}
            <div className="px-8 aspect-square relative perspective-[2000px] w-full max-w-[450px] mx-auto">
              <motion.div
                layoutId="player-artwork"
                className="relative w-full h-full rounded-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.8)] cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: showLyrics ? 180 : 0 }}
                transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
              >
                {/* Front (Image) */}
                <div onClick={() => setShowLyrics(true)} className="absolute inset-0 rounded-[24px] overflow-hidden" style={{ backfaceVisibility: 'hidden', pointerEvents: showLyrics ? 'none' : 'auto' }}>
                  <img
                    src={resolvedImageSrc || getImageSrc(currentTrack?.album?.image || currentTrack?.image || currentTrack?.original?.album?.image || currentTrack?.original?.image)}
                    alt={currentTrack.albumTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Back (Lyrics) */}
                <div
                  onClick={() => setShowLyrics(false)}
                  className="absolute inset-0 rounded-[24px] overflow-hidden bg-black/50 cursor-pointer flex flex-col"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: showLyrics ? 'auto' : 'none' }}
                >
                  <div className="flex justify-center pt-4 pb-2 relative z-20">
                    <span
                      onClick={(e) => { e.stopPropagation(); setShowLyrics(false); }}
                      className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold text-white uppercase shadow-sm cursor-pointer"
                    >
                      Volver a Portada
                    </span>
                  </div>
                  <div onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center cursor-default px-4 pb-6" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex flex-col items-center justify-center min-h-full py-10" ref={lyricsContainerRef}>
                      {parsedLyrics ? (
                        parsedLyrics.map((line, idx) => (
                          <p key={idx} className="text-white/50 text-[1.25rem] leading-[1.4] font-bold mb-6 transition-all duration-500 origin-center flex flex-col items-center gap-1.5" style={{ opacity: 0.3, transform: 'scale(0.95)' }}>
                             {line.text}
                          </p>
                        ))
                      ) : (
                        <div className="text-white/80 text-lg font-semibold whitespace-pre-wrap">{lyrics}</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Audio Visualizer Canvas */}
            <div className="px-8 mt-4 sm:mt-6 h-[40px] sm:h-[60px] flex items-end justify-center w-full max-w-[450px] mx-auto">
              <canvas
                ref={canvasRef}
                width={320}
                height={60}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1" />
          </div>

          {/* Bottom section (Info + Controls) */}
          <div className="pb-[90px] sm:pb-32 relative z-10 w-full max-w-[500px] mx-auto">
            
            {/* Track Info & Actions */}
            <div className="px-8 flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col items-start gap-1 flex-1 min-w-0 pr-4">
                <h2 ref={titleRef} className="text-[22px] sm:text-[26px] leading-tight font-bold text-white truncate w-full tracking-tight">{currentTrack.title}</h2>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[16px] sm:text-[18px] text-white/60 truncate leading-none">{currentTrack.artist}</span>
                  <span className="text-[9px] font-bold tracking-[0.15em] text-white/80 bg-white/10 px-1.5 py-1 rounded-[4px] border border-white/10 leading-none">LOSSLESS</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => Capacitor.isNativePlatform() ? YagamiNative.startDownload({ trackId: currentTrack.id, url: currentTrack.streamUrl, title: currentTrack.title, artist: currentTrack.artist, coverUrl: resolvedImageSrc }) : setDownloadItem(currentTrack)}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Download className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setContextMenuTrack({ item: currentTrack, type: 'track' }); }}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div ref={containerRef} className="px-8 mb-4 sm:mb-6 relative group cursor-pointer flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                step="0.01"
                defaultValue="0"
                ref={seekInputRef}
                onChange={handleSeekChange}
                onMouseDown={() => setIsScrubbing(true)}
                onMouseUp={(e) => handleSeekCommit(e)}
                onTouchStart={() => setIsScrubbing(true)}
                onTouchEnd={(e) => handleSeekCommit(e)}
                onTouchCancel={(e) => handleSeekCommit(e)}
                className="scrubber-input absolute top-0 w-[calc(100%-4rem)] mx-8 h-8 z-20 opacity-0 cursor-pointer"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
              <div className="track-bg relative flex items-center bg-white/10 rounded-full pointer-events-none h-1.5">
                <div
                  ref={progressRef}
                  className="track-fill absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-100"
                  style={{ width: '0%', backgroundColor: dominantColor || '#ffffff' }}
                />
              </div>
              <div className="flex justify-between text-[12px] font-semibold font-mono text-white/50 tracking-wide mt-1">
                <span ref={currentTimeRef}>0:00</span>
                <span ref={remainingTimeRef}>-0:00</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between px-8">
              <button
                onClick={toggleShuffle}
                className={\`transition-colors p-2 \${isShuffle ? 'text-white' : 'text-white/30'}\`}
              >
                <Shuffle className="w-[22px] h-[22px]" />
              </button>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => { safeHaptics(ImpactStyle.Light); prevTrack(); }}
                className="p-3 text-white"
              >
                <SkipBack className="w-8 h-8 fill-current" />
              </motion.button>
              
              <motion.button
                ref={playButtonRef}
                whileTap={{ scale: 0.85 }}
                onClick={() => { safeHaptics(ImpactStyle.Medium); togglePlay(); }}
                className="w-20 h-20 flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: dominantColor || '#ffffff',
                  color: '#000000',
                  boxShadow: dominantColor ? \`0 10px 30px \${dominantColor}80\` : 'none'
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: isPlaying ? '0' : '4px' }} className="transition-all duration-300">
                  <motion.path
                    animate={{
                      d: isPlaying
                        ? "M 6 4 L 10 4 L 10 20 L 6 20 Z"
                        : "M 5 3 L 12 7.5 L 12 16.5 L 5 21 Z"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                  <motion.path
                    animate={{
                      d: isPlaying
                        ? "M 14 4 L 18 4 L 18 20 L 14 20 Z"
                        : "M 12 7.5 L 19 12 L 19 12 L 12 16.5 Z"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                </svg>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => { safeHaptics(ImpactStyle.Light); nextTrack(); }}
                className="p-3 text-white"
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </motion.button>
              <button
                onClick={toggleRepeat}
                className={\`transition-colors p-2 relative \${repeatMode !== 'off' ? 'text-white' : 'text-white/30'}\`}
              >
                <Repeat className="w-[22px] h-[22px]" />
                {repeatMode === 'one' && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold">1</span>
                )}
              </button>
            </div>
          </div>

          {/* Queue Modal */}
          <div
            className={\`absolute inset-0 z-50 bg-black p-6 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] \${showQueue ? 'translate-y-0' : 'translate-y-full'}\`}
          >
            <div className="flex items-center justify-between mb-6 pt-10 relative z-10">
              <h3 className="text-2xl font-bold text-white tracking-tight">A continuación</h3>
              <button onClick={() => setShowQueue(false)} className="p-2 -mr-2 rounded-full bg-white/10 text-white transition-colors">
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
            {dominantColor && (
              <div
                className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none"
                style={{ background: \`radial-gradient(circle at 100% 0%, \${dominantColor} 0%, transparent 60%)\` }}
              />
            )}
            <div onTouchMove={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto pb-20 space-y-4">
              {queue.map((track, idx) => {
                const isPlayingQueue = currentTrack?.id === track.id;
                return (
                  <div key={idx} onClick={() => playTrack(track)} className={\`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors \${isPlayingQueue ? 'bg-white/10' : ''}\`}>
                    <OfflineImage localPath={track.localCoverPath || track.original?.localCoverPath} remoteUrl={getImageSrc(track?.album?.image || track?.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className={\`font-bold truncate \${isPlayingQueue ? 'text-white' : 'text-white/80'}\`}>
                        {track.title}
                      </p>
                      <p className="text-sm text-white/50 truncate">{track.artist}</p>
                    </div>
                    {isPlayingQueue && (
                      <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                        <div className="w-[3px] bg-white rounded-full animate-[bounce_1s_infinite] h-2"></div>
                        <div className="w-[3px] bg-white rounded-full animate-[bounce_1s_infinite_0.2s] h-4"></div>
                        <div className="w-[3px] bg-white rounded-full animate-[bounce_1s_infinite_0.4s] h-3"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`;

c = c.replace(returnRegex, newReturn);
fs.writeFileSync(f, c);
