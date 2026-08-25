const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Library Icon
code = code.replace(
  "import { Home, Search, Settings as SettingsIcon } from 'lucide-react';",
  "import { Home, Search, Library, Settings as SettingsIcon } from 'lucide-react';"
);

// 2. Import LibraryTab
code = code.replace(
  "import SettingsTab from './components/SettingsTab';",
  "import SettingsTab from './components/SettingsTab';\nimport LibraryTab from './components/LibraryTab';"
);

// 3. Update state
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'home' | 'search' | 'settings'>('home');",
  "const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'settings'>('home');"
);

// 4. Add the component to main content
code = code.replace(
  "          <div className={activeTab === 'settings' ? 'block h-full' : 'hidden'}>\n            <SettingsTab isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />\n          </div>",
  "          <div className={activeTab === 'library' ? 'block h-full' : 'hidden'}>\n            <LibraryTab />\n          </div>\n          <div className={activeTab === 'settings' ? 'block h-full' : 'hidden'}>\n            <SettingsTab isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />\n          </div>"
);

// 5. Add the nav button (after search)
const navButtonTarget = `            <button
              onClick={() => setActiveTab('search')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'search' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Search size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Buscar</span>
            </button>`;

const newNavButton = `            <button
              onClick={() => setActiveTab('library')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'library' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Library size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Librería</span>
            </button>`;

code = code.replace(navButtonTarget, navButtonTarget + "\n            \n" + newNavButton);

fs.writeFileSync('src/App.tsx', code);
