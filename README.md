# Topoviewer
Yo, listen up! This mind-blowing project is all about hooking you up with the dopest network visualization tool out there. We're talking about taking your topology data and turning it into a sick cytoscape graph model that you can peep using https://js.cytoscape.org. It's like having a virtual eye candy for your network!

Now, let's break it down into three rad sections:

TopoEngine: This bad boy is all about converting your topology data (right now it's Container Lab) into a sick cytoscape graph model. Once translated, you can visualize that bad boy and watch your network come to life.

CloudshellWrapper: Here's the deal, we've got a wicked wrapper for https://github.com/zephinzer/cloudshell. It's like having your own personal Xterm.js frontend that connects to a Go backend and gives you a shell right in your browser. Yeah, you heard it right, access your shell using your browser. It's like having a virtual command center at your fingertips. And guess what? If you're running CloudshellWrapper on the same host as containerlab, you can even access the nodes of containerlab through your browser. How cool is that?

Container Lab client: We've got your back when it comes to launching Wireshark for some remote capture action in Container-Lab's link. We've wrapped it up nicely so you can cross-launch Wireshark with ease. No more hassle, just seamless remote capturing.

But hey, keep in mind, exposing your shell via a browser can be risky business. We're just putting it out there, so if you decide to dive in, do it at your own risk. Stay rad, my friend!


## Quick Run - With ContainerLab Topology file

Get ContainerLab topology export template and example containerLab topology file. 
```Shell
wget https://github.com/asadarafat/topoViewer/blob/development/rawTopoFile/template-clab-cyto.tmpl
wget https://raw.githubusercontent.com/asadarafat/topoViewer/development/rawTopoFile/topo-topoViewerDemo.yaml
```

Deploy the ContainerLab topology file

```Shell
clab deploy -t topo-topoViewerDemo.yaml --export-template template-clab-cyto.tmpl

```

Open the TopoViewer GUI in browser http://138.203.40.63:8080/ 
note that 138.203.40.63 is the clab server 



## Quick Run - CloudShell access
Click the node to open Node Properties, and then click SSH Session

## Quick Run - Wireshark Capture
TopoViewer has a remote capture feature that allows to intercept ContainerLab node's endPoint - provided that topoViewer is running on the same server as ContainerLab node. The feature relies on the client-side application to run SSH command using iTerm to execute tcpdump remotely and pipe it to the client's Wireshark.

### ContainerLab Wireshark Client - MAC 
![](https://github.com/asadarafat/topoViewer/blob/development/docs/mac-client-package-edit-client-capture-wireshark.gif)

#### Prerequisite
- Ensure iTerm installed in MAC client side
- Ensure the Wireshark is installed in client side.
- Setup SSH keyless access to ContainerLab host
- Download the "ContainerLab Wireshark Client - MAC" app extract and copy the app into /Applications folder


## Quick Run - Link Impairment
TopoViewer has Link Impairment feature that allow ContainerLab link to be impaired - provided that topoViewer is running on the same server as ContainerLab 
and ![Pumba](https://github.com/alexei-led/pumba/releases) binary is installed in ContainerLab host. Similar with ContainerLab Wireshark Client the feature relies on the client-side application to execute Pumba command over SSH.

### ContainerLab Link Impairment Client - MAC 
![](https://github.com/asadarafat/topoViewer/blob/development/docs/mac-client-package-edit-client-pumba-delay.gif)

#### Prerequisite
- Ensure iTerm installed in MAC client side
- Ensure the Pumba is installed ContainerLab host.
- Setup SSH keyless access to ContainerLab host
- Download the "ContainerLab Link Impairment Client - MAC" app extract and copy the app into /Applications folder



# How To 
## Run TopoEngine Go Code
create cytoscape model based on ContainerLab yaml file definition
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
vscode ➜ /workspaces/topoViewer (development) $ go run cloudshellwrapper/cmd/main.go clab -H 138.203.40.63 -t rawTopoFile/clab-topo-file.yaml ## obsolete
vscode ➜ /workspaces/topoViewer (development) $ go run cloudshellwrapper/cmd/main.go clab -j rawTopoFile/clab-Vodafone-CO-HCO/topology-data.json   -H 138.203.40.63 -u suuser 
```


```Shell
vscode ➜ /workspaces/topoViewer (development ✗) $ go run cloudshellwrapper/cmd/main.go nsp  -H 138.203.40.63 --topology-ietf-l2-topo  rawTopoFile/topo-ietf-L2.json --topology-ietf-l3-topo rawTopoFile/topo-ietf-L3-TopologyId-1\:65000\:1-isis.json --multi-layer enabled
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
[suuser@nsp-kvm-host-antwerp bng-cups]$ sudo clab deploy -t cups.yml --debug --export-template /home/suuser/topoViewer/rawTopoFile/clab-topo-export-template/clab-topo-cytoscape.tmpl 

## BNG-CUPS run topoViewer
[suuser@nsp-kvm-host-antwerp topoViewer]$ go run cloudshellwrapper/cmd/main.go clab -H 138.203.40.63 -u suuser  -j rawTopoFile/clab/bng-cups/clab-cups/topology-data.json 
[suuser@nsp-kvm-host-antwerp topoViewer]$ go run cloudshellwrapper/cmd/main.go clab -H 138.203.26.59 -u root  -j rawTopoFile/clab/bng-cups/clab-cups/topology-data.json 