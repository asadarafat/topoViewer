#!/bin/bash
echo "Cleanup dist folder..."
rm -rR dist/*
mkdir dist/html-public
touch dist/html-public/put-html-asset-here.txt

echo "Build Linux Binary..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer cloudshellwrapper/cmd/main.go 

echo "Copy topoviewer Binary..."
mv topoviewer dist/topoviewer
cp -r config dist

echo "Copy clab client..."
cp -r tools/clab-client-mac dist/clab-client-mac
cp -r tools/clab-client-windows dist/clab-client-windows

echo "Copy html folder and assets..."
cp -r html-static dist/html-static
cp rawTopoFile/topo-topoViewerDemo.yaml dist/topo-topoViewerDemo.yaml

echo "Create TAR package..."
tar -czvf dist/TopoViewer.tar.gz dist

echo "Distribution build done..."