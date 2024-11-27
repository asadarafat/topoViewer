#!/bin/bash

# Prompt the user for Tag name
read -p "Enter the version Tag: " tag

# Display the entered parameters
echo "Hello, the version Tag tobe used is $tag"

sudo chown -R $(whoami):$(whoami) *

cp go_cloudshellwrapper/constants.go go_cloudshellwrapper/constants.go.bak
sed -i "s/\(var VersionInfo string = \)\"[^\"]*\"/\1\"$tag\"/" go_cloudshellwrapper/constants.go

echo "Cleanup dist folder..."
rm -rRf dist/*
mkdir dist/html-public
touch dist/html-public/put-html-asset-here.txt

echo "Build Linux Binary..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer go_cloudshellwrapper/cmd/main.go 

echo "Copy TopoViewer Binary..."
mv topoviewer dist/topoviewer
cp -r config dist

echo "Create clab client windows package..."
rm -f tools/clab-client-windows/ClabCapture.app.zip
rm -f tools/clab-client-windows/ClabPumbaDelay.app.zip
zip tools/clab-client-windows/ClabCapture.app.zip tools/clab-client-windows/clabcapture.bat  tools/clab-client-windows/clab-capture.reg  tools/clab-client-windows/clab-capture-readme.MD
# zip tools/clab-client-windows/ClabPumbaDelay.app.zip   tools/clab-client-windows/clabpumba.bat    tools/clab-client-windows/clab-pumba.reg    tools/clab-client-windows/clab-pumba-readme.MD

echo "Copy clab client packages..."
mkdir dist/clab-client-mac
cp -r tools/clab-client-mac/ClabCapture.app.zip dist/clab-client-mac/ClabCapture.app.zip

mkdir dist/clab-client-windows
chmod 775 tools/clab-client-windows/*
cp tools/clab-client-windows/ClabCapture.app.zip dist/clab-client-windows/ClabCapture.app.zip
# cp tools/clab-client-windows/ClabPumbaDelay.app.zip dist/clab-client-windows/ClabPumbaDelay.app.zip
chmod 775 dist/clab-client-windows/*

echo "Clab export template..."
cp rawTopoFile/clab-topo-export-template-example/clab-topo-new-version-cytoscape.tmpl dist/clab-topoviewer.tmpl

rm -rR html-static/clab-client
mkdir html-static/clab-client
cp -r dist/clab-client-mac html-static/clab-client/
cp -r dist/clab-client-windows html-static/clab-client/


# echo "Copy Pumba_linux_amd64 Binary..."
# cp -r tools/pumba_linux_amd64 dist/pumba_linux_amd64

echo "Copy html folder and assets..."
cp -rR html-static dist/html-static
rm -rR dist/html-static/template/archive-clab
rm -rR dist/html-static/template/archive-nsp


echo "Copy Docker entrypoint.sh ..."
cp tools/entrypoint.sh dist/entrypoint.sh 

# echo "Zipping dist folder..."
# zip dist/dist.zip dist/*

echo "Git Commit and Push with tag $tag"
git add .
git add dist/topoviewer
git commit -m "commit with tag $tag "
git tag $tag

# Push the commit and the tag to the remote repository
git push origin development --tags


echo "Distribution build done..."