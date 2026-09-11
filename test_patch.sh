#!/bin/bash
SOURCES_UUID=$(awk '/isa = PBXSourcesBuildPhase;/ {print $1}' ios/App/App.xcodeproj/project.pbxproj | head -n 1)
FILE_REF_UUID="YAGAMI000000000000000001"
BUILD_FILE_UUID="YAGAMI000000000000000002"

echo "Sources UUID: $SOURCES_UUID"
