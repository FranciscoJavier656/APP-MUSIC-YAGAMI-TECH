const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add DownloadsTab import
code = code.replace(
  "import LibraryTab from './components/LibraryTab';",
  "import LibraryTab from './components/LibraryTab';\nimport DownloadsTab from './components/DownloadsTab';"
);

// 2. Add Download to lucide-react imports
code = code.replace(
  "import { Home, Search, Library, Settings as SettingsIcon } from 'lucide-react';",
  "import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';"
);

// 3. Update state type
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'settings'>('home');",
  "const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');"
);

// 4. Add DownloadsTab component in main
const downloadsTabDiv = `          <div className={activeTab === 'downloads' ? 'block h-full' : 'hidden'}>
            <DownloadsTab />
          </div>`;

code = code.replace(
  "          <div className={activeTab === 'library' ? 'block h-full' : 'hidden'}>\n            <LibraryTab />\n          </div>",
  "          <div className={activeTab === 'library' ? 'block h-full' : 'hidden'}>\n            <LibraryTab />\n          </div>\n" + downloadsTabDiv
);

// 5. Add nav button
const downloadButton = `            <button
              onClick={() => setActiveTab('downloads')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'downloads' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Download size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Descargas</span>
            </button>
            `;

code = code.replace(
  "                        <button\n              onClick={() => setActiveTab('library')}",
  downloadButton + "\n                        <button\n              onClick={() => setActiveTab('library')}"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for 5 tabs");
