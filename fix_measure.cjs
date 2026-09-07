const fs = require('fs');
const f = 'src/components/LiquidTabBar.tsx';
let c = fs.readFileSync(f, 'utf8');

const measurementEffect = `
  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Sync bubble to active tab when active tab changes externally (or centers recalculate)
  useEffect(() => {
    if (centers.length > 0) {
      const idx = TABS.findIndex(t => t.id === activeTab);
      if (idx !== -1 && !isDragging.current) {
        animate(bubbleX, centers[idx], SNAP_SPRING as any);
      }
    }
  }, [activeTab, centers, bubbleX]);
`;

c = c.replace('  // Removed buggy global listeners', measurementEffect);

fs.writeFileSync(f, c);
