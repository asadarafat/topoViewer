
#!/bin/bash
echo deploy clab bng-cups...
echo default IP address 138.203.26.59
read -p 'TopoViewer Server IP address: ' ip
path=$(pwd)
cd rawTopoFile/clab/bng-cups/
clab deploy -t cups.yml --export-template $path/rawTopoFile/clab-topo-export-template/clab-topo-cytoscape.tmpl
# cd ../../..
# go run cloudshellwrapper/cmd/main.go clab -H $ip -u suuser  -j rawTopoFile/clab/bng-cups/clab-cups/topology-data.json 

