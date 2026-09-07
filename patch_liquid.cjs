const fs = require('fs');
const f = 'src/components/LiquidTabBar.tsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the buggy useLayoutEffect with a proper pointerdown handler
c = c.replace(
  /useLayoutEffect\(\(\) => \{[\s\S]*?bar\.addEventListener\('pointercancel', onUp\);\n  \}, \[centers, bubbleX, setActiveTab\]\);/,
  `// Removed buggy global listeners`
);

// Update handlePointerDown to actually handle the drag
c = c.replace(
  /const handlePointerDown = useCallback\(\(e: React\.PointerEvent\) => \{\n    \/\/ We handle dragging in pointermove, no preventDefault here so clicks work\n  \}, \[\]\);/,
  `const handlePointerDown = useCallback((e: React.PointerEvent) => {
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
      
      // We do NOT call setActiveTab here to avoid conflicting with button onClick.
      // The button's onClick will handle the actual tab switch.
      // We only snap the visual bubble if it was dragged.
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
  }, [centers, bubbleX]);`
);

fs.writeFileSync(f, c);
