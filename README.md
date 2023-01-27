# Topoviewer
This project is an attempt to provide network visualization tool based on topology data as input.
There are three sections of codes in this project.
- TopoEngine, which provides the ability to convert a topology data(at the moment Container Lab) into a cytoscape graph model. The graph model can be visualized using https://js.cytoscape.org after it has been translated.
- CloudshellWrapper is a wrapper for https://github.com/zephinzer/cloudshell (which provides an Xterm.js frontend that connects to a Go backend to provide the host system with a shell). Basically, use a browser to access your shell.) When CloudshellWrapper is running on the same host as containerlab, the node of containerlab may be accessed via a browser.
- Container Lab client, which provides a wrapper to easily cross launch Wireshark to do remote capture of Container-Lab's link.

Please keep in mind that exposing shell via browser is risky; use at your own risk.


## Quick Run - With ContainerLab Topo

![](https://github.com/asadarafat/topoViewer/blob/development/docs/topoViewer-quickRun-containerLab.gif)

Define the topoviewer as ContainerLab Node and ensure the topology file (that will be visualised) is mounted as docker binds.

```Shell
[root@nsp-kvm-host-antwerp clab]# more topo-topoViewerDemo.yml

name: topoViewerDemo

mgmt:
  ipv4_subnet: 20.20.20.0/24       # ipv4 range
  
topology:

  nodes:
    topoviewer:
      kind: linux
      image: ghcr.io/asadarafat/topoviewer:development
      ports:
        - 8080:8080
      exec:
        - /opt/topoviewer/topoviewer clab -H 138.203.40.63 -t local-bind/topo-file.yaml -u suuser
        # 138.203.40.63 is the server IP where clab is running
        # suuser is the containerLab host user name
      entrypoint: /bin/bash
      binds:
        - /home/suuser/clab/topo-topoViewerDemo.yml:/opt/topoviewer/local-bind/topo-file.yaml:rw 
          # /home/suuser/clab/topo-topoViewerDemo.yml is the absolute path clab topology file 
    srl-01:
      kind: srl
      mgmt_ipv4: 20.20.20.201
      image: ghcr.io/nokia/srlinux
    srl-02:
      kind: srl
      mgmt_ipv4: 20.20.20.202
      image: ghcr.io/nokia/srlinux
    sros-01:
      kind: vr-sros
      mgmt_ipv4: 20.20.20.101
      group: "1"
      image: registry.srlinux.dev/pub/vr-sros:22.7.R1
      type: "cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=4 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28"
      license: license.txt
    sros-02:
      kind: vr-sros
      mgmt_ipv4: 20.20.20.102
      group: "1"
      image: registry.srlinux.dev/pub/vr-sros:22.7.R1
      type: "cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=4 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28"
      license: license.txt
    sros-03:
      kind: vr-sros
      mgmt_ipv4: 20.20.20.103
      group: "1"
      image: registry.srlinux.dev/pub/vr-sros:22.7.R1
      type: "cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=4 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28"
      license: license.txt
    sros-04:
      kind: vr-sros
      mgmt_ipv4: 20.20.20.104
      group: "1"
      image: registry.srlinux.dev/pub/vr-sros:22.7.R1
      type: "cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=4 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28"
      license: license.txt

  links:
    - endpoints: ["srl-01:e1-1", "sros-01:eth1"]
    - endpoints: ["srl-01:e1-2", "sros-02:eth1"]

    - endpoints: ["sros-01:eth2", "sros-02:eth2"]
    - endpoints: ["sros-01:eth3", "sros-03:eth3"]

    - endpoints: ["sros-02:eth4", "sros-03:eth4"]
    - endpoints: ["sros-02:eth5", "sros-04:eth5"]

    - endpoints: ["sros-03:eth6", "sros-04:eth6"]

    - endpoints: ["sros-01:eth4", "sros-04:eth4"]

    - endpoints: ["sros-03:eth1", "srl-02:e1-3"]
    - endpoints: ["sros-04:eth2", "srl-02:e1-4"]
```

Deploy the ContainerLab topology file

```Shell
[root@nsp-kvm-host-antwerp clab]# clab deploy --topo topo-topoViewerDemo.yml
INFO[0000] Containerlab v0.31.1 started                 
INFO[0000] Parsing & checking topology file: topo-topoViewerDemo.yml 
Error: containers ["clab-topoViewerDemo-srl-01" "clab-topoViewerDemo-srl-02" "clab-topoViewerDemo-sros-01" "clab-topoViewerDemo-sros-02" "clab-topoViewerDemo-sros-03" "clab-topoViewerDemo-sros-04" "clab-topoViewerDemo-topoviewer"] already exist. Add '--reconfigure' flag to the deploy command to first remove the containers and then deploy the lab
[root@nsp-kvm-host-antwerp clab]# clab destroy --topo topo-topoViewerDemo.yml
INFO[0000] Parsing & checking topology file: topo-topoViewerDemo.yml 
INFO[0000] Destroying lab: topoViewerDemo               
INFO[0000] Removed container: clab-topoViewerDemo-topoviewer 
INFO[0000] Removed container: clab-topoViewerDemo-srl-01 
INFO[0000] Removed container: clab-topoViewerDemo-srl-02 
INFO[0001] Removed container: clab-topoViewerDemo-sros-02 
INFO[0001] Removed container: clab-topoViewerDemo-sros-01 
INFO[0001] Removed container: clab-topoViewerDemo-sros-04 
INFO[0001] Removed container: clab-topoViewerDemo-sros-03 
INFO[0001] Removing containerlab host entries from /etc/hosts file 
[root@nsp-kvm-host-antwerp clab]# clab deploy --reconfigure --topo topo-topoViewerDemo.yml
INFO[0000] Containerlab v0.31.1 started                 
INFO[0000] Parsing & checking topology file: topo-topoViewerDemo.yml 
INFO[0000] Removing /home/suuser/clab/clab-topoViewerDemo directory... 
INFO[0000] Creating lab directory: /home/suuser/clab/clab-topoViewerDemo 
INFO[0000] Creating docker network: Name="clab", IPv4Subnet="20.20.20.0/24", IPv6Subnet="", MTU="1500" 
INFO[0000] Creating container: "topoviewer"             
INFO[0000] Creating container: "sros-03"                
INFO[0000] Creating container: "sros-01"                
INFO[0000] Creating container: "sros-04"                
INFO[0000] Creating container: "sros-02"                
INFO[0000] Creating container: "srl-02"                 
INFO[0000] Creating container: "srl-01"                 
INFO[0000] Creating virtual wire: sros-01:eth2 <--> sros-02:eth2 
INFO[0001] Creating virtual wire: sros-02:eth4 <--> sros-03:eth4 
INFO[0001] Creating virtual wire: sros-03:eth6 <--> sros-04:eth6 
INFO[0001] Creating virtual wire: sros-02:eth5 <--> sros-04:eth5 
INFO[0001] Creating virtual wire: sros-01:eth3 <--> sros-03:eth3 
INFO[0001] Creating virtual wire: sros-01:eth4 <--> sros-04:eth4 
INFO[0001] Creating virtual wire: srl-01:e1-2 <--> sros-02:eth1 
INFO[0001] Creating virtual wire: srl-01:e1-1 <--> sros-01:eth1 
INFO[0001] Creating virtual wire: sros-03:eth1 <--> srl-02:e1-3 
INFO[0001] Creating virtual wire: sros-04:eth2 <--> srl-02:e1-4 
INFO[0002] Running postdeploy actions for Nokia SR Linux 'srl-02' node 
INFO[0002] Running postdeploy actions for Nokia SR Linux 'srl-01' node 
INFO[0013] Adding containerlab host entries to /etc/hosts file 
+---+--------------------------------+--------------+-------------------------------------------+---------+---------+-----------------+--------------+
| # |              Name              | Container ID |                   Image                   |  Kind   |  State  |  IPv4 Address   | IPv6 Address |
+---+--------------------------------+--------------+-------------------------------------------+---------+---------+-----------------+--------------+
| 1 | clab-topoViewerDemo-srl-01     | 9b86d76155d9 | ghcr.io/nokia/srlinux                     | srl     | running | 20.20.20.201/24 | N/A          |
| 2 | clab-topoViewerDemo-srl-02     | 5eaec760b2ba | ghcr.io/nokia/srlinux                     | srl     | running | 20.20.20.202/24 | N/A          |
| 3 | clab-topoViewerDemo-sros-01    | 508232ecc71f | registry.srlinux.dev/pub/vr-sros:22.7.R1  | vr-sros | running | 20.20.20.101/24 | N/A          |
| 4 | clab-topoViewerDemo-sros-02    | 96b3aba26eed | registry.srlinux.dev/pub/vr-sros:22.7.R1  | vr-sros | running | 20.20.20.102/24 | N/A          |
| 5 | clab-topoViewerDemo-sros-03    | 18d9c2babbbf | registry.srlinux.dev/pub/vr-sros:22.7.R1  | vr-sros | running | 20.20.20.103/24 | N/A          |
| 6 | clab-topoViewerDemo-sros-04    | 109ef1111472 | registry.srlinux.dev/pub/vr-sros:22.7.R1  | vr-sros | running | 20.20.20.104/24 | N/A          |
| 7 | clab-topoViewerDemo-topoviewer | a64a3b12e806 | ghcr.io/asadarafat/topoviewer:development | linux   | running | 20.20.20.2/24   | N/A          |
+---+--------------------------------+--------------+-------------------------------------------+---------+---------+-----------------+--------------+
```

Open the TopoViewer GUI in browser http://138.203.40.63:8080/ 
note that 138.203.40.63 is the clab server 

## Quick Run - CloudShell access

## Quick Run - Wireshark Capture
TopoViewer has a remote capture feature that allows it to intercept ContainerLab's node endPoint - provided that topoViewer is running on the same server as containerLab's node.
The feature relies on the client-side application to run tcpdump remotely and pipe it to the client's Wireshark.

### Pre-requisite - MAC
- Ensure the Wireshark is installed client side.
- Download the "ContainerLab Wireshark Client - MAC" app extract and copy the app into /Applications folder

## Quick Run - Link Impairment
MAC
First download the "ContainerLab LinkImpairment Client - MAC" app extract and copy the app into /Applications folder






# How To 
## Run TopoEngine Go Code
create cytoscape model based on containerLab yaml file definition
```Shell
vscode ➜ /workspaces/topoViewer (development) $ pwd
/workspaces/topoViewer
vscode ➜ /workspaces/topoViewer (development) $ go run topoengine/cmd/main.go 
```

## Run CloudshellWrapper Go Code
```Shell
vscode ➜ /workspaces/topoViewer (development) $ pwd
/workspaces/topoViewer
vscode ➜ /workspaces/topoViewer (development) $ go run cloudshellwrapper/cmd/main.go --help
vscode ➜ /workspaces/topoViewer (development) $ go run cloudshellwrapper/cmd/main.go clab -t rawTopoFile/clab-topo-file.yaml 
```


```Shell
vscode ➜ /workspaces/topoViewer (development ✗) $ go run cloudshellwrapper/cmd/main.go nsp  --topology-ietf-l2-topo  rawTopoFile/topo-ietf-L2.json --topology-ietf-l3-topo rawTopoFile/topo-ietf-L3-TopologyId-1\:65000\:1-isis.json --multi-layer enabled
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
