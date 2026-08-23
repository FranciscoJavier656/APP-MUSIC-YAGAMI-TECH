const fs = require('fs');

let config = fs.readFileSync('capacitor.config.ts', 'utf8');

const replacement = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.audiophile.player',
  appName: 'Audiophile Player',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;`;

fs.writeFileSync('capacitor.config.ts', replacement);
console.log("Patched capacitor config");
