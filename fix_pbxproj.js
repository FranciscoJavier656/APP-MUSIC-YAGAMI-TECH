const xcode = require('xcode');
const fs = require('fs');
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parseSync();
myProj.addSourceFile('App/YagamiDownloadManager.swift', { target: myProj.getFirstTarget().uuid });
fs.writeFileSync(projectPath, myProj.writeSync());
console.log('Added YagamiDownloadManager.swift to pbxproj');
