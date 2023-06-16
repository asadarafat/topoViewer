
#!/bin/bash
echo deploy clab bng-cups...
cd /home/suuser/topoViewer/rawTopoFile/clab/bng-cups/
sudo clab deploy -t cups.yml --debug --export-template /home/suuser/topoViewer/rawTopoFile/clab-topo-export-template/clab-topo-cytoscape.tmpl 
cd ../../..
go run cloudshellwrapper/cmd/main.go clab -H 138.203.40.63 -u suuser  -j rawTopoFile/clab/bng-cups/clab-cups/topology-data.json 

