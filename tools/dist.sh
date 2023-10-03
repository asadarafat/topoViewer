#!/bin/bash

# Prompt the user for Tag name
read -p "Enter the version Tag: " tag

# Display the entered parameters
echo "Hello, the version Tag tobe used is $tag"

cp go_cloudshellwrapper/constants.go cloudshellwrapper/constants.go.bak
sed -i "s/\(var VersionInfo string = \)\"[^\"]*\"/\1\"$tag\"/" cloudshellwrapper/constants.go

echo "Cleanup dist folder..."
rm -rRf dist/*
mkdir dist/html-public
touch dist/html-public/put-html-asset-here.txt

echo "Build Linux Binary..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer go_cloudshellwrapper/cmd/main.go 

echo "Copy TopoViewer Binary..."
mv topoviewer dist/topoviewer
cp -r config dist

echo "Create clab client Package..."
rm -f tools/clab-client-windows/ClabCapture.app.zip
rm -f tools/clab-client-windows/ClabPumbaDelay.app.zip
zip tools/clab-client-windows/ClabCapture.app.zip tools/clab-client-windows/clabcapture.bat  tools/clab-client-windows/clab-capture.reg  tools/clab-client-windows/clab-capture-readme.MD
zip tools/clab-client-windows/ClabPumbaDelay.app.zip   tools/clab-client-windows/clabpumba.bat    tools/clab-client-windows/clab-pumba.reg    tools/clab-client-windows/clab-pumba-readme.MD


echo "Copy clab client..."
cp -r tools/clab-client-mac dist/clab-client-mac

mkdir dist/clab-client-windows
cp tools/clab-client-windows/ClabCapture.app.zip dist/clab-client-windows/ClabCapture.app.zip
cp tools/clab-client-windows/ClabPumbaDelay.app.zip dist/clab-client-windows/ClabPumbaDelay.app.zip


rm -rR html-static/clab-client
mkdir html-static/clab-client
cp -r dist/clab-client-mac html-static/clab-client/
cp -r dist/clab-client-windows html-static/clab-client/


echo "Copy Pumba_linux_amd64 Binary..."
cp -r tools/pumba_linux_amd64 dist/pumba_linux_amd64

echo "Copy html folder and assets..."
cp -rR html-static dist/html-static
rm -rR dist/html-static/archive-clab
rm -rR dist/html-static/archive-nsp


echo "Copy Docker entrypoint.sh ..."
cp tools/entrypoint.sh dist/entrypoint.sh 

echo "Git Commit and Push with tag Tag"
git add dist/topoviewer
git commit -am \"$tag\"
git tag $tag
git push --tags


# echo "Create TAR package..."
# tar -czvf dist/TopoViewer.tar.gz dist

# echo "Optimize binary size..."
# upx --brute dist/topoviewer 

echo "Distribution build done..."