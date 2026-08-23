const fs = require('fs');

// 1. SearchTab.tsx
let searchCode = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
searchCode = searchCode.replace(`import React, { useState } from 'react';`, `import React, { useState } from 'react';\nimport { searchQobuz } from '../lib/qobuz';`);
searchCode = searchCode.replace(/const res = await axios\.get\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/search`.*?res\.data\);/s, `const data = await searchQobuz(query);\n        setResults(data);`);
fs.writeFileSync('src/components/SearchTab.tsx', searchCode);

// 2. AlbumView.tsx
let albumCode = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
albumCode = albumCode.replace(`import React, { useState, useEffect } from 'react';`, `import React, { useState, useEffect } from 'react';\nimport { getQobuzAlbum } from '../lib/qobuz';`);
albumCode = albumCode.replace(/const res = await axios\.get\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/album`.*?res\.data\);/s, `const data = await getQobuzAlbum(albumId);\n        setAlbum(data);`);
fs.writeFileSync('src/components/AlbumView.tsx', albumCode);

// 3. PlayerContext.tsx
let playerCode = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
playerCode = playerCode.replace(`import React, { createContext, useContext, useState, useRef, useEffect } from 'react';`, `import React, { createContext, useContext, useState, useRef, useEffect } from 'react';\nimport { getQobuzTrackUrl } from '../lib/qobuz';`);
playerCode = playerCode.replace(/const res = await axios\.get\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/stream`, \{ params: \{ track_id: track\.id \} \}\);\s*const streamUrl = res\.data\.url;/s, `const streamUrl = await getQobuzTrackUrl(track.id, '5');`);
fs.writeFileSync('src/components/PlayerContext.tsx', playerCode);

// 4. AssistantTab.tsx
let assistantCode = fs.readFileSync('src/components/AssistantTab.tsx', 'utf8');
assistantCode = assistantCode.replace(`import React, { useState, useRef, useEffect } from 'react';`, `import React, { useState, useRef, useEffect } from 'react';\nimport { chatWithGemini } from '../lib/gemini';`);
assistantCode = assistantCode.replace(/const res = await axios\.post\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/chat`, \{ message: fullPrompt \}\);.*?const aiMessage: Message = \{[^}]*text: res\.data\.text\s*\};/s, `const responseText = await chatWithGemini(fullPrompt);\n      const aiMessage: Message = {\n        id: Date.now().toString() + 1,\n        role: 'assistant',\n        content: responseText\n      };`);
fs.writeFileSync('src/components/AssistantTab.tsx', assistantCode);

console.log("Patched UI components to use client-side libraries.");
