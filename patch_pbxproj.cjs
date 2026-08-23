const xcode = require('xcode');
const fs = require('fs');

const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parseSync();

// Add the swift file
const swiftFile = myProj.addSourceFile('App/QobuzAudioPlugin.swift', null, myProj.getFirstTarget().uuid);
if (swiftFile) {
    console.log('Added Swift file');
} else {
    console.log('Swift file already exists or failed');
}

// Add the m file
const mFile = myProj.addSourceFile('App/QobuzAudioPlugin.m', null, myProj.getFirstTarget().uuid);
if (mFile) {
    console.log('Added M file');
} else {
    console.log('M file already exists or failed');
}

fs.writeFileSync(projectPath, myProj.writeSync());
console.log('PBXProj updated!');
