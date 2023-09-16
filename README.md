# Topoviewer
Yo, listen up! This mind-blowing project is all about hooking you up with the dopest network visualization tool out there. We're talking about taking your topology data and turning it into a sick cytoscape graph model that you can peep using https://js.cytoscape.org. It's like having a virtual eye candy for your network!

Now, let's break it down into three rad sections:

TopoEngine: This bad boy is all about converting your topology data (right now it's Container Lab) into a sick cytoscape graph model. Once translated, you can visualize that bad boy and watch your network come to life.

CloudshellWrapper: Here's the deal, we've got a wicked wrapper for https://github.com/zephinzer/cloudshell. It's like having your own personal Xterm.js frontend that connects to a Go backend and gives you a shell right in your browser. Yeah, you heard it right, access your shell using your browser. It's like having a virtual command center at your fingertips. And guess what? If you're running CloudshellWrapper on the same host as containerlab, you can even access the nodes of containerlab through your browser. How cool is that?

Container Lab client: We've got your back when it comes to launching Wireshark for some remote capture action in Container-Lab's link. We've wrapped it up nicely so you can cross-launch Wireshark with ease. No more hassle, just seamless remote capturing.

But hey, keep in mind, exposing your shell via a browser can be risky business. We're just putting it out there, so if you decide to dive in, do it at your own risk. Stay rad, my friend!


## Quick Run - With ContainerLab Topology file

The simplest approach to utilise TopoViewer with Containerlab is to add the following code under the 'nodes:' section to a topology YAML file.
```Shell
    topoviewer:
      kind: linux
      mgmt-ipv4: 10.10.10.200
      image: ghcr.io/asadarafat/topoviewer:latest
      ports:
        - 8080:8080
          #### the opend port could be adjusted accordingly, not always 8080.
      # exec:
      # - '/opt/topoviewer/topoviewer clab -H 138.203.26.59 -P 8080 -u root -p j0k0w1 -j local-bind/topo-file.json' 
          #### "root" corresponds to the server username where containerLab is currently operational.
          #### "j0k0w1", corresponds to user's password
          #### "138.203.26.59," corresponds to the server IP address where containerLab is currently operational.
          #### "8080", corresponds to the port where the topoViewer service will be listening.
                
      binds:
        - __clabDir__/topology-data.json:/opt/topoviewer/local-bind/topo-file.json:ro
          #### __clabDir__/topology-data.json is path to clab's json file which generated by "clab --export-template" and /opt/topoviewer/local-bind/topo-file.json is the mount path of topoviever's topology file.
      labels:
        topo-viewer-role: controller
```

Grab ContainerLab topology export template, it's gonna help us export out the ContainerLab's topology in a format that TopoViewer can consume."
for containerlab version: 0.41.2 and below:
```Shell
wget https://github.com/asadarafat/topoViewer/blob/development/rawTopoFile/template-clab-cyto.tmpl
```
for containerlab version: version: 0.44.3:
```Shell
wget https://github.com/asadarafat/topoViewer/blob/development/rawTopoFile/clab-topo-new-version-cytoscape.tmpl
```

Get ContainerLab topology YAML file
```Shell
wget https://raw.githubusercontent.com/asadarafat/topoViewer/development/rawTopoFile/topo-nokia-MAGc-lab.yaml
```

Deploy the ContainerLab topology file.
```Shell
clab deploy -t topo-nokia-MAGc-lab.yaml --export-template template-clab-cyto.tmpl

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