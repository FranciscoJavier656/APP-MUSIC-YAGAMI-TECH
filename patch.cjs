const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hook = `  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    document.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      document.removeEventListener('navigate', handleNavigate);
    };
  }, []);
`;

code = code.replace("const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');", "const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');\n\n" + hook);

fs.writeFileSync('src/App.tsx', code);
