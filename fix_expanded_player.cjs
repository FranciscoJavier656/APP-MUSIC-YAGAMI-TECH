const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

if (!code.includes("import { Filesystem, Directory }")) {
  code = code.replace("import { Capacitor } from '@capacitor/core';", "import { Capacitor } from '@capacitor/core';\nimport { Filesystem, Directory } from '@capacitor/filesystem';");
}

const customEffect = `
  const [resolvedImageSrc, setResolvedImageSrc] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    const remoteUrl = getImageSrc(currentTrack?.album?.image || currentTrack?.image);
    const localPath = currentTrack?.localCoverPath || currentTrack?.original?.localCoverPath;
    
    if (Capacitor.isNativePlatform() && localPath) {
      Filesystem.getUri({
        directory: Directory.Data,
        path: localPath.replace('file://', '')
      }).then(res => {
        if (mounted) setResolvedImageSrc(Capacitor.convertFileSrc(res.uri));
      }).catch(e => {
        if (mounted) setResolvedImageSrc(remoteUrl);
      });
    } else {
      setResolvedImageSrc(remoteUrl);
    }
    return () => { mounted = false; };
  }, [currentTrack]);

  useEffect(() => {
    if (resolvedImageSrc) {
      const img = new Image();
      if (resolvedImageSrc.startsWith('http')) {
         img.crossOrigin = 'Anonymous';
      }
      img.src = resolvedImageSrc;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setDominantColor(\`rgb(\${r}, \${g}, \${b})\`);
        }
      };
      img.onerror = () => setDominantColor(null);
    } else {
      setDominantColor(null);
    }
  }, [resolvedImageSrc]);
`;

const oldEffect = `  useEffect(() => {
    if (currentTrack?.image) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = getImageSrc(currentTrack.image) || '';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setDominantColor(\`rgb(\${r}, \${g}, \${b})\`);
        }
      };
      img.onerror = () => setDominantColor(null);
    } else {
      setDominantColor(null);
    }
  }, [currentTrack?.image]);`;

if (code.includes(oldEffect)) {
    code = code.replace(oldEffect, customEffect);
    console.log("Replaced useEffect for image");
}

code = code.replace(/<img\s+src=\{getImageSrc\(currentTrack\.image\)\}/g, "<img\n              src={resolvedImageSrc || getImageSrc(currentTrack?.image)}");

code = code.replace(/<img src=\{getImageSrc\(track\.image\)\}/g, "<img src={getImageSrc(track?.album?.image || track?.image)}");

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
