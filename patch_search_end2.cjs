const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

const endPart = '      <AnimatePresence>\n        {downloadItem && (\n          <DownloadModal \n            item={downloadItem.item} \n            type={downloadItem.type} \n            onClose={() => setDownloadItem(null)} \n          />\n        )}\n      </AnimatePresence>\n    </div>\n    </div>\n  );\n}';

const lines = code.split('\\n');
const lastAnimateIndex = code.lastIndexOf('<AnimatePresence>');
if (lastAnimateIndex !== -1) {
    code = code.substring(0, lastAnimateIndex) + endPart;
}

fs.writeFileSync('src/components/SearchTab.tsx', code);
