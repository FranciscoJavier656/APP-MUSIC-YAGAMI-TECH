const fs = require('fs');

// 3. PlayerContext.tsx
let playerCode = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
playerCode = playerCode.replace(/const res = await axios\.get\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/stream`, \{ params: \{ track_id: track\.id \} \}\);\s*const streamUrl = res\.data\.url;/s, `const streamUrl = await getQobuzTrackUrl(track.id.toString(), '5');`);
fs.writeFileSync('src/components/PlayerContext.tsx', playerCode);

// 4. AssistantTab.tsx
let assistantCode = fs.readFileSync('src/components/AssistantTab.tsx', 'utf8');
assistantCode = assistantCode.replace(/const res = await axios\.post\(`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''\}\/api\/chat`, \{ message: fullPrompt \}\);.*?const aiMessage: Message = \{[^}]*text: res\.data\.text\s*\};/s, `const responseText = await chatWithGemini(fullPrompt);\n      const aiMessage: Message = {\n        id: Date.now().toString() + 1,\n        role: 'assistant',\n        content: responseText\n      };`);
fs.writeFileSync('src/components/AssistantTab.tsx', assistantCode);

console.log("Patched leftovers.");
