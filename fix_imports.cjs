const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(/import React, \{ createContext, useContext, useState, useRef, useEffect, ReactNode \} from 'react';/, "import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';\nimport { Capacitor } from '@capacitor/core';\nimport { QobuzAudio } from '../lib/QobuzAudioPlugin';");

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Fixed imports");
