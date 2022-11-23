
# Topoviewer
This project is an attempt to provide network visualization tool based on topology data as input.
There are three sections of codes in this project.
- TopoEngine, which provides the ability to convert a topology file(at the moment Container Lab) into a cytoscape graph model. The graph model can be visualized using https://js.cytoscape.org after it has been translated.
- CloudshellWrapper is a wrapper for https://github.com/zephinzer/cloudshell (which provides an Xterm.js frontend that connects to a Go backend to provide the host system with a shell). Basically, use a browser to access your shell.) When CloudshellWrapper is running on the same host as containerlab, the node of containerlab may be accessed via a browser.
- Container Lab client, which provides a wrapper to easily cross launch Wireshark to do remote capture of Container-Lab's link.

Please keep in mind that exposing shell via browser is risky; use at your own risk.

![](https://github.com/asadarafat/topoViewer/blob/development/docs/topoViewer.gif)


## Topoviewer Installation
Topoviewer currently only distributed for Linux amd64 architecture.

### Download distribution package
- Download the TopoViewer.tar.gz file (can found under dist/topoViewer folder) to your Linux x64 server.
after extracting under topoViewer folder you will get the following html-public and html-private folders

    ```Shell
    [corla@nsp-kvm-host-antwerp ~]$ tree -L 2
    .
    ├── clab
    │   ├── license.txt
    │   └── topo-topoViewerDemo.yaml
    └── topoViewer
        ├── html-public
        ├── html-static
        └── topoviewer
    ```

## Quick Run - cloudShell
### Pre-requisite
- Ensure the containerLab is running, the ``topo-topoViewerDemo.yaml `` can be found [here](https://github.com/asadarafat/topoViewer/blob/development/rawTopoFile/topo-topoViewerDemo.yaml "here")
    ```Shell
    [corla@nsp-kvm-host-antwerp ~]$ cd clab/
    [corla@nsp-kvm-host-antwerp clab]$ sudo clab deploy --topo topo-topoViewerDemo.yaml 
    INFO[0000] Containerlab v0.31.1 started                 
    INFO[0000] Parsing & checking topology file: topo-topoViewerDemo.yaml 
    INFO[0000] Creating lab directory: /home/corla/clab/clab-topoViewerDemo 
    INFO[0000] Creating docker network: Name="clab", IPv4Subnet="20.20.20.0/24", IPv6Subnet="", MTU="1500" 
    INFO[0000] Creating container: "SROS-01"                
    INFO[0000] Creating container: "SROS-02"                
    INFO[0000] Creating container: "SROS-04"                
    INFO[0000] Creating container: "SROS-03"                
    INFO[0000] Creating container: "SRL-02"                 
    INFO[0000] Creating container: "SRL-01"                 
    INFO[0000] Creating virtual wire: SROS-01:eth4 <--> SROS-04:eth4 
    INFO[0001] Creating virtual wire: SROS-01:eth3 <--> SROS-03:eth3 
    INFO[0001] Creating virtual wire: SROS-03:eth6 <--> SROS-04:eth6 
    INFO[0001] Creating virtual wire: SRL-01:e1-1 <--> SROS-01:eth1 
    INFO[0001] Creating virtual wire: SROS-01:eth2 <--> SROS-02:eth2 
    INFO[0001] Creating virtual wire: SROS-02:eth4 <--> SROS-03:eth4 
    INFO[0001] Creating virtual wire: SRL-01:e1-2 <--> SROS-02:eth1 
    INFO[0001] Creating virtual wire: SROS-02:eth5 <--> SROS-04:eth5 
    INFO[0001] Creating virtual wire: SROS-04:eth2 <--> SRL-02:e1-4 
    INFO[0001] Creating virtual wire: SROS-03:eth1 <--> SRL-02:e1-3 
    INFO[0002] Running postdeploy actions for Nokia SR Linux 'SRL-01' node 
    INFO[0002] Running postdeploy actions for Nokia SR Linux 'SRL-02' node 
    INFO[0014] Adding containerlab host entries to /etc/hosts file 
    +---+-----------------------------+--------------+------------------------------------------+---------+---------+-----------------+--------------+
    | # |            Name             | Container ID |                  Image                   |  Kind   |  State  |  IPv4 Address   | IPv6 Address |
    +---+-----------------------------+--------------+------------------------------------------+---------+---------+-----------------+--------------+
    | 1 | clab-topoViewerDemo-SRL-01  | 902a06ba2472 | ghcr.io/nokia/srlinux                    | srl     | running | 20.20.20.201/24 | N/A          |
    | 2 | clab-topoViewerDemo-SRL-02  | 661c1a60f989 | ghcr.io/nokia/srlinux                    | srl     | running | 20.20.20.202/24 | N/A          |
    | 3 | clab-topoViewerDemo-SROS-01 | 4b3b6144ea27 | registry.srlinux.dev/pub/vr-sros:22.7.R1 | vr-sros | running | 20.20.20.101/24 | N/A          |
    | 4 | clab-topoViewerDemo-SROS-02 | d90e54de1ac2 | registry.srlinux.dev/pub/vr-sros:22.7.R1 | vr-sros | running | 20.20.20.102/24 | N/A          |
    | 5 | clab-topoViewerDemo-SROS-03 | efc97a21d801 | registry.srlinux.dev/pub/vr-sros:22.7.R1 | vr-sros | running | 20.20.20.103/24 | N/A          |
    | 6 | clab-topoViewerDemo-SROS-04 | b5eca1d406d3 | registry.srlinux.dev/pub/vr-sros:22.7.R1 | vr-sros | running | 20.20.20.104/24 | N/A          |
    +---+-----------------------------+--------------+------------------------------------------+---------+---------+-----------------+--------------+
    [corla@nsp-kvm-host-antwerp clab]$ 
    ```
- Ensure the topoViewer running in the same host as containerLab.
    ```Shell
    [corla@nsp-kvm-host-antwerp clab]$ cd ../topoViewer/
    [corla@nsp-kvm-host-antwerp topoViewer]$ ./topoviewer clab -H 138.203.40.63 -p 8080 -t ../clab/topo-topoViewerDemo.yaml
    ```

 - At this point the topoViewer and containerLab are running in the same server.
To see the topoViewer GUI, from the client side brower enter the url with the following syntax ``http://<server-ip>:<port>``
in this example the url would be ``http://138.203.40.63:8080/``. To open cloudShell click node and click "Open SSH Session", as shown in below high resolution video can be found [here](https://github.com/asadarafat/topoViewer/blob/development/docs/topoViewer.mp4 "here")

## Quick Run - Wireshark capture
TopoViewer has a remote capture feature that allows it to intercept containerLab's node endPoint - provided that topoViewer is running on the same server as containerLab's node.
The feature relies on the client-side application to run tcpdump remotely and pipe it to the client's Wireshark.

### Pre-requisite
- Ensure the topoViewer running in the same host as containerLab.
- Ensure the Wireshark ist installed client side.
- Download client package 
    - [Windows](https://github.com/asadarafat/topoViewer/tree/main/dist/clab-client-windows "here for windows") 
    - [MAC](https://github.com/asadarafat/topoViewer/tree/main/dist/clab-client-mac "here for MAC") 


### Windows client package
- The package should be like in the following structure.
    ```Shell
    vscode ➜ .../topoViewerContainerDev/topoViewer/dist/clab-client-windows (development ✗) $ tree -L 1

    ├── clabcapture.bat
    ├── clab-capture.reg
    └── plink.exe
    ```
- Copied all the files into
    ```Shell
    C:\Program Files\clab-client-windows
    ```
    ![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package.png)
- Install the registry
    ![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-install-registry.png)
- Edit the clab-capture.bat file, enter the password of server side user - the user used to run topoViewer in server.
    ![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-edit-client-capture-bat-passord.png)
- Open topoViewer in your browser and follow the instructions in the video below to do Wireshark capture.
        ![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-edit-client-capture-wireshark.gif)


### MAC client package
- Downloaded MAC client package should be like in the following sructure.
    ```Shell
    vscode ➜ .../topoViewerContainerDev/topoViewer/dist/clab-client-mac (development ✗) $ tree -L 1
    .
    └── ClabCapture.app.zip
    ```
- Unzip it and copied the ClabCapture.app file into ``Applications`` folder
- Download and install iTerm2 and Wireshark application
 - Open topoViewer in your browser and follow the instructions in the video below to do Wireshark capture.
    ![](https://github.com/asadarafat/topoViewer/blob/development/docs/mac-client-package-edit-client-capture-wireshark.gif)


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

## Build TopoViewer Binary - Linux
build linux amd64 binary
```Shell
vscode ➜ /workspaces/topoViewer (development) $ GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer cloudshellwrapper/cmd/main.go 
```

## Run TopoViewer Binary 
Ensure to run binary file in the same directory with html folder
```Shell
vscode ➜ /workspaces/topoViewer/dist/topoViewer (development ✗) $ pwd
/workspaces/topoViewer/dist/topoViewer
vscode ➜ /workspaces/topoViewer/dist/topoViewer (development ✗) $ ./topoviewer clab -t ../../rawTopoFile/topo-topoViewerDemo.yaml 
```


