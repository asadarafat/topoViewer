# Topoviewer

## Overview
Yo, listen up! This mind-blowing project is all about hooking you up with the dopest network visualization tool out there. We're talking about taking your topology data and turning it into a sick cytoscape graph model that you can peep using https://js.cytoscape.org. It's like having a virtual eye candy for your network!

Now, let's break it down into three rad sections:

TopoEngine: This bad boy is all about converting your topology data (right now it's Container Lab) into a sick cytoscape graph model. Once translated, you can visualize that bad boy and watch your network come to life.

CloudshellWrapper: Here's the deal, we've got a wicked wrapper for https://github.com/zephinzer/cloudshell. It's like having your own personal Xterm.js frontend that connects to a Go backend and gives you a shell right in your browser. Yeah, you heard it right, access your shell using your browser. It's like having a virtual command center at your fingertips. And guess what? If you're running CloudshellWrapper on the same host as containerlab, you can even access the nodes of containerlab through your browser. How cool is that?

Container Lab client: We've got your back when it comes to launching Wireshark for some remote capture action in Container-Lab's link. We've wrapped it up nicely so you can cross-launch Wireshark with ease. No more hassle, just seamless remote capturing.

But hey, keep in mind, exposing your shell via a browser can be risky business. We're just putting it out there, so if you decide to dive in, do it at your own risk. Stay rad, my friend!


## Quickstart
The simplest approach to utilise TopoViewer with Containerlab is to include the under the 'nodes:' section to a topology YAML file.

copy paste below start-up script, to deploy a Containerlab topology with topoviewer.

```Shell
bash -c "$(wget -qO - https://raw.githubusercontent.com/asadarafat/nokia-DataCenterFabric-lab/main/demo-deploy.sh)"
```

Quickstart Video
[![Quickstart Video](http://img.youtube.com/vi/na6M1Zfum4o/0.jpg)](https://youtu.be/na6M1Zfum4o "TopoViewer - Quickstart")





## How-to guides

### See node Properties

### See link Properties

### Get to the node console

### Packet capture

### Link impairment

### Fit topology to screen

### Find node

### Find shorthest route between two nodes

### Adjust layout

### Toggle link endpoint label

### Toggle node container status

### Capture and export the topology viewport










## Tested Environment
- containerlab version:  0.41.2, 0.44.3, 0.46.0
- docker-ce version: 24.0.2
