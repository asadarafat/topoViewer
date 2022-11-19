## Topoviewer Installation

Topoviewer currently only distributed for Linux amd64 architecture.

### Download distribution package
Download the TopoViewer.tar.gz file (can found under bdist/topoViewer folder) to your Linux x64 server.
after extracting under topoViewer folder you will get the following html-public and html-private folders

```
[corla@nsp-kvm-host-antwerp ~]$ tree -L 2
.
├── clab
│   ├── license.txt
│   └── topo-topoViewerDemo.yml
└── topoViewer
    ├── html-public
    ├── html-static
    └── topoviewer
```

## Quick Run - cloudShell
### Pre-requisite
- Ensure the containerLab is running, the ``topo-topoViewerDemo.yml `` can be found [here](https://github.com/asadarafat/topoViewer/blob/development/rawTopoFile/topo-topoViewerDemo.yml "here")
```
[corla@nsp-kvm-host-antwerp ~]$ cd clab/
[corla@nsp-kvm-host-antwerp clab]$ sudo clab deploy --topo topo-topoViewerDemo.yml 
INFO[0000] Containerlab v0.31.1 started                 
INFO[0000] Parsing & checking topology file: topo-topoViewerDemo.yml 
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
```
[corla@nsp-kvm-host-antwerp clab]$ cd ../topoViewer/
[corla@nsp-kvm-host-antwerp topoViewer]$ ./topoviewer -H 138.203.40.63 -p 8080 -t ../clab/topo-topoViewerDemo.yaml
```

At this point the topoViewer and containerLab are running in the same server.
To see the topoViewer GUI, from the client side brower enter the url with the following syntax ``http://<server-ip>:<port>``
in this example the url would be ``http://http://138.203.40.63:8080/``. To open cloudShell click node and click "Open SSH Session", as shown in below

![](https://github.com/asadarafat/topoViewer/blob/development/docs/topoViewer.gif)

high resolution video can be found [here](https://github.com/asadarafat/topoViewer/blob/development/docs/topoViewer.mp4 "here")

## Quick Run - Wireshark capture
TopoViewer has a remote capture feature that allows it to intercept containerLab's node endPoint - provided that topoViewer is running on the same server as containerLab's node.
The feature relies on the client-side application to run tcpdump remotely and pipe it to the client wireshark.

### Pre-requisite
- Ensure the topoViewer running in the same host as containerLab.
- Ensure the Wireshark ist installed client side.
- Download client package.

### Windows client package
The package should be like in the following structure.

```
vscode ➜ .../topoViewerContainerDev/topoViewer/dist/clab-client-windows (development ✗) $ tree -L 1

├── clabcapture.bat
├── clab-capture.reg
└── plink.exe
```
Copied all the files into
```
C:\Program Files\clab-client-windows
```
![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package.png)

Install the registry
![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-install-registry.png)

Edit the clab-capture.bat file, enter the password of server side user - the user used to run topoViewer in server.
![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-edit-client-capture-bat-passord.png)

Open topoViewer from the browser.
![](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-edit-client-capture-wireshark.gif)

high resolution video can be found [here](https://github.com/asadarafat/topoViewer/blob/development/docs/windows-client-package-edit-client-capture-wireshark.mp4 "here")


