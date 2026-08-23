const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `    // 6. Send File to Client
    res.download(finalPath, \`\${artist} - \${title}.\${ext}\`, (err) => {
      if (err) console.error("Error sending file to client:", err);
      cleanup();
    });`;

const newCode = `    // 6. Send File to Client
    res.setHeader('Content-Disposition', \`attachment; filename="\${artist.replace(/[/\\\\?%*:|"<>]/g, '-')} - \${title.replace(/[/\\\\?%*:|"<>]/g, '-')}.\${ext}"\`);
    res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'audio/flac');
    const readStream = fs.createReadStream(finalPath);
    readStream.on('close', cleanup);
    readStream.on('error', (err) => {
      console.error("Error sending file to client:", err);
      cleanup();
    });
    readStream.pipe(res);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('server.ts', code);
