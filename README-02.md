## Run CloudshellWrapper Go Code
```Shell
vscode ➜ /workspaces/topoViewer (development) $ pwd
/workspaces/topoViewer
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go --help
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go clab -H 138.203.40.63 -t rawTopoFile/clab-topo-file.yaml ## obsolete
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go clab -j rawTopoFile/clab-Vodafone-CO-HCO/topology-data.json   -H 138.203.
40.63 -u suuser ## obsolete
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go clab -j rawTopoFile/clab/bng-cups/clab-cups/topology-data.json   -H 138.2
03.40.63 -u root

138.203.26.59


```
bash -c "$(wget -qO - https://raw.githubusercontent.com/asadarafat/topoViewer/development/tools/getGithubApi.sh)" -- --version 1.2.3


```Shell
vscode ➜ /workspaces/topoViewer (development ✗) $≈nsp  -H 138.203.40.63 --topology-ietf-l2-topo  rawTopoFile/topo-ietf-L2
.json --topology-ietf-l3-topo rawTopoFile/topo-ietf-L3-TopologyId-1\:65000\:1-isis.json --multi-layer enabled
```


## Build TopoViewer Binary - Linux
build linux amd64 binary
```Shell
vscode ➜ /workspaces/topoViewer (development) $ GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer cloudshellwrapper/cmd/main.go 
```

## Run TopoViewer Binary 
Ensure to run binary file in the same directory with html folder
Running inside dist folder
```Shell
vscode ➜ /workspaces/topoViewer/dist (development ✗) $ ./topoviewer clab -t topo-topoViewerDemo.yaml  
```

## Create Distribution Folder
```Shell
vscode ➜ /workspaces/topoViewer (development ✗) $ ./tools/dist.sh 
```

# BNG-CUPS
## BNG-CUPS Deploy CLAB
[suuser@nsp-kvm-host-antwerp bng-cups]$ sudo clab deploy -t cups.yml --debug --export-template /home/suuser/topoViewer/rawTopoFile/clab-topo-export-template/c
lab-topo-cytoscape.tmpl 


## NSP IETF L2 run topoViewer
[root@kvm-host-antwerp02 topoViewer]# go run cloudshellwrapper/cmd/main.go nsp -H 138.203.26.59 --topology-ietf-l2-topo rawTopoFile/ietf-topo-examples/ietf-L2
.json --multi-layer disable

## BNG-CUPS run topoViewer inside docker 
docker exec -it clab-nokia-MAGc-lab-topoviewer /opt/topoviewer/topoviewer clab -H 138.203.26.59 -P 8080 -u suuser -p Lab-Her0 -j local-bind/topo-file.json


## Run TopoViewer Code
```Shell
go run go_cloudshellwrapper/cmd/main.go clab --allowed-hostnames 149.204.21.68 --clab-user aarafat  --server-port 8087 --topology-file-json ./rawTopoFile/clab/nokia-MultiAccessGateway-lab/clab-nokia-MAGc-lab/topology-data.json 

vscode ➜ /workspaces/topoViewer/dist (development ✗) $ ./topoviewer clab -t topo-topoViewerDemo.yaml  
```


sudo go run go_topoengine/cmd/main.go 
	tools.CommentProcessor("./html-public/nokia-ServiceProvider/button.html", "./html-static/template/clab/button.tmpl")


## 
```Shell
sudo go run go_cloudshellwrapper/cmd/main.go clab --allowed-hostnames nsp-clab1.nice.nokia.net --clab-user asad --clab-pass 'Lab-Her0' --server-port 8081 --topology-file-json ./rawTopoFile/topology-data-sample-serviceProvider.json --deployment-type colocated
```