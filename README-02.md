
Here is the quickstart video clip.

<div align="left" width="100%" height="365" >
  <a href="https://www.youtube.com/watch?v=na6M1Zfum4o"><img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-quickstart.png" alt="TopoViewer - Quickstart video clip"></a>
</div>



## How-to guides

* **See node Properties**
  <details>
    <summary>Simply click the node</summary>
    <img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-nodeProperties.gif"/>
  </details>

* **See link Properties**
    <details>
    <summary>Simply click the node</summary>
    <img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-linkProperties.gif"/>
  </details>

* **Get to the node console**
    <details>
      <summary>web console</summary>
      <img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-nodeWebConsole.gif"/>
    </details>

    <details>
      <summary>terminal console</summary>
      <img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-nodeTerminalConsole.gif"/>
    </details>


* **Packet capture**
    <details>
      <summary>
        Wireshark Client Helper
      </summary>
      <p>There are two type of suported client here, Windows version and MAC version, both of the clients can be find in "Setting Menu, TopoViewer Helper App". Once the Wireshark client helper installed, simply click Cross Launch Button in link Properties.
      </p>
      <p>
        Using Windows version of Wireshark Client Helper:
          <ul>
            <li> Download and install the Windows version of Wireshark Client Helper. </li>
            <li> Ensure PowerShell installed in Windows client side </li>
            <li> Ensure the Wireshark is installed in client side, from client side, otherwise the password need tobe entered manually </li>
            <li> Setup SSH keyless access to ContainerLab host </li>
            <li> Copy clabcapture.bat and clab-capture.reg into C:\Program Files\clab-client </li>
            <li> Merge clab-capture.reg into Windows Registry, simply double click it. </li>
          </ul>
        </p>
        <p>
          Using MAC version of Wireshark Client Helper:
          <ul>
            <li> Download and install the MAC version of Wireshark Client Help, extract and copy the app into /Applications folder  </li>
            <li> Ensure iTerm installed in MAC client side </li>
            <li> Ensure the Wireshark is installed in client side. </li>
            <li> Setup SSH keyless access to ContainerLab host from client side, otherwise the password need tobe entered manually </li>
            <li> From link properties, click Capture Source/Target Endpoint cross-launch button 
                <img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-WiresharkHelperApp-MAC.gif"/> 
                </li>
          </ul>
        </p>
    </details>

* **Link impairment**




## Tested Environment
- containerlab version:  0.41.2, 0.44.3, 0.46.0
- docker-ce version: 24.0.2


## Build TopoViewer Binary - Linux
build linux amd64 binary
```Shell
vscode ➜ /workspaces/topoViewer (development) $ GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer cloudshellwrap
per/cmd/main.go 
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

## Run TopoViewer Code
```Shell
vscode ➜ /workspaces/topoViewer (development ✗) go run go_cloudshellwrapper/cmd/main.go clab --allowed-hostnames 149.204.21.68 --clab-user aarafat  --server-port 8087 --topology-file-json ./rawTopoFile/clab/nokia-MultiAccessGateway-lab/clab-nokia-MAGc-lab/topology-data.json 
```

## Run TopoViewer Binary
```Shell
 [aarafat@nsp-clab1 topoViewer]$ sudo topoviewer clab --allowed-hostnames 149.204.21.68 --clab-user aarafat  --server-port 8087 --topology-file-json /home/aarafat/topoViewer/rawTopoFile/clab/nokia-MultiAccessGateway-lab/clab-nokia-MAGc-lab/topology-data.json
 ```
 

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




