const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Fix translateY CSS bug
const oldTransform = "style={{ transform: `translateY(${isExpanded ? touchOffsetY : '100%'}px)` }}";
const newTransform = "style={{ transform: isExpanded ? (touchOffsetY > 0 ? `translateY(${touchOffsetY}px)` : 'translateY(0px)') : 'translateY(100%)' }}";
code = code.replace(oldTransform, newTransform);

// 2. Fix seek bar touch events
const oldSeekInput = `<input
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="absolute top-1/2 -translate-y-1/2 w-full h-8 z-10 opacity-0 cursor-pointer"
          />`;
const newSeekInput = `<input
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute top-1/2 -translate-y-1/2 w-full h-8 z-10 opacity-0 cursor-pointer touch-none"
          />`;
code = code.replace(oldSeekInput, newSeekInput);

// 3. Make handleSeekCommit robust for touch events
const oldHandleSeekCommit = `  const handleSeekCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? duration;
    seekTo((val / 100) * dur);
    // Add small delay to let native catch up before we resume automatic updates
    setTimeout(() => setIsScrubbing(false), 200);
  };`;
const newHandleSeekCommit = `  const handleSeekCommit = (e: any) => {
    let val = parseFloat(e.target?.value);
    if (isNaN(val) && seekInputRef.current) {
        val = parseFloat(seekInputRef.current.value);
    }
    const dur = (audioRef.current as any)?.nativeDuration ?? (audioRef.current?.duration || duration);
    seekTo((val / 100) * dur);
    // Add small delay to let native catch up before we resume automatic updates
    setTimeout(() => setIsScrubbing(false), 200);
  };`;
code = code.replace(oldHandleSeekCommit, newHandleSeekCommit);

// 4. Also fix handleSeekChange typing
const oldHandleSeekChange = `  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);`;
const newHandleSeekChange = `  const handleSeekChange = (e: any) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);`;
code = code.replace(oldHandleSeekChange, newHandleSeekChange);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
