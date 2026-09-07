const fs = require('fs');
const f = 'src/components/LiquidTabBar.tsx';
let c = fs.readFileSync(f, 'utf8');

const replacement = `  // ── Drag interaction ──────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    
    const onMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;
      const localX = ev.clientX - rect.left;
      bubbleX.set(localX);
    };
    
    const onUp = (ev: PointerEvent) => {
      isDragging.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      
      if (!centers.length) return;
      const localX = ev.clientX - rect.left;
      let nearestIdx = 0;
      let minDist = Infinity;
      centers.forEach((c, i) => {
        const d = Math.abs(c - localX);
        if (d < minDist) { minDist = d; nearestIdx = i; }
      });
      animate(bubbleX, centers[nearestIdx], SNAP_SPRING as any);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [centers, bubbleX]);

  // ── Active icon lift animation ───────────────────────────────`;

c = c.replace('  // ── Active icon lift animation ───────────────────────────────', replacement);

fs.writeFileSync(f, c);
