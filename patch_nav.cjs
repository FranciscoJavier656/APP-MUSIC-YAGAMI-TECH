const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  `<span className="text-[10px] font-medium uppercase tracking-tighter">Librería</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}`,
  `<span className="text-[10px] font-medium uppercase tracking-tighter">Librería</span>
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={\`flex flex-col items-center gap-1 transition-colors \${
                activeTab === 'downloads' ? 'text-[#007AFF]' : 'text-gray-400 dark:text-gray-500'
              }\`}
            >
              <Download size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Descargas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}`
);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
