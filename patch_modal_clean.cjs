const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

const oldBlobFn = `const downloadFileAsBlob = async (url: string, filename: string) => {
    const res = await axios.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };`;

if (code.includes(oldBlobFn)) {
  code = code.replace(oldBlobFn, '');
  fs.writeFileSync('src/components/DownloadModal.tsx', code);
  console.log("Cleaned unused func");
}
