const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
code = code.replace("import SearchTab from './components/SearchTab';", "import HomeTab from './components/HomeTab';\nimport SearchTab from './components/SearchTab';");
code = code.replace("import { Search, Settings as SettingsIcon } from 'lucide-react';", "import { Home, Search, Settings as SettingsIcon } from 'lucide-react';");

// States
code = code.replace("const [activeTab, setActiveTab] = useState<'search' | 'settings'>('search');", "const [activeTab, setActiveTab] = useState<'home' | 'search' | 'settings'>('home');");

// Render tabs
const oldMain = `<main className="flex-1 overflow-y-auto pb-[88px] relative">
          <div className={activeTab === 'search' ? 'block h-full' : 'hidden'}>
            <SearchTab />
          </div>`;
          
const newMain = `<main className="flex-1 overflow-y-auto pb-[88px] relative">
          <div className={activeTab === 'home' ? 'block h-full' : 'hidden'}>
            <HomeTab />
          </div>
          <div className={activeTab === 'search' ? 'block h-full' : 'hidden'}>
            <SearchTab />
          </div>`;
          
code = code.replace(oldMain, newMain);

// Add bottom nav button
const oldNav = `<button
              onClick={() => setActiveTab('search')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'search' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Search size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Buscar</span>
            </button>`;
            
const newNav = `<button
              onClick={() => setActiveTab('home')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'home' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Home size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Inicio</span>
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'search' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Search size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Buscar</span>
            </button>`;

code = code.replace(oldNav, newNav);

fs.writeFileSync('src/App.tsx', code);
