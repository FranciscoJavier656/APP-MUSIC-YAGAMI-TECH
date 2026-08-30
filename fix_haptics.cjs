const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const helper = `  const safeHaptics = (style: ImpactStyle) => {
    try {
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style }).catch(() => {});
      }
    } catch (e) {}
  };`;

// Insert helper at the start of the component
code = code.replace(
  "const { \n    currentTrack",
  helper + "\n\n  const { \n    currentTrack"
);

// Replace direct calls
code = code.replace(/Haptics\.impact\(\{ style: ImpactStyle\.Light \}\)/g, "safeHaptics(ImpactStyle.Light)");
code = code.replace(/Haptics\.impact\(\{ style: ImpactStyle\.Medium \}\)/g, "safeHaptics(ImpactStyle.Medium)");

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
