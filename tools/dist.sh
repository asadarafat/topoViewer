#!/bin/bash
echo "Cleanup dist folder..."
rm -rR dist/*
mkdir dist/html-public
touch dist/html-public/put-html-asset-here.txt

echo "Build Linux Binary..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer cloudshellwrapper/cmd/main.go 

echo "Copy TopoViewer Binary..."
mv topoviewer dist/topoviewer
cp -r config dist

echo "Create clab client Package..."
zip tools/clab-client-windows/ClabCapture.app.zip tools/clab-client-windows/clabcapture.bat  tools/clab-client-windows/clab-capture.reg  tools/clab-client-windows/clab-capture-readmee.MD
zip tools/clab-client-windows/ClabPumba.app.zip   tools/clab-client-windows/clabpumba.bat    tools/clab-client-windows/clab-pumba.reg    tools/clab-client-windows/clab-pumba-readme.MD


echo "Copy clab client..."
cp -r tools/clab-client-mac dist/clab-client-mac
cp -r tools/clab-client-windows dist/clab-client-windows

rm -rR html-static/clab-client
mkdir html-static/clab-client
mkdir html-static/clab-client/windows
mkdir html-static/clab-client/mac
cp -r tools/clab-client-mac html-static/clab-client/
cp -r tools/clab-client-windows html-static/clab-client/


echo "Copy Pumba_linux_amd64 Binary..."
cp -r tools/pumba_linux_amd64 dist/pumba_linux_amd64

echo "Copy html folder and assets..."
cp -r html-static dist/html-static
cp rawTopoFile/topo-topoViewerDemo.yaml dist/topo-topoViewerDemo.yaml

echo "Copy Docker entrypoint.sh ..."
cp tools/entrypoint.sh dist/entrypoint.sh 


# echo "Create TAR package..."
# tar -czvf dist/TopoViewer.tar.gz dist

# echo "Optimize binary size..."
# upx --brute dist/topoviewer 

echo "Distribution build done..."