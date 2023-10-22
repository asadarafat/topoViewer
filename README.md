# Topoviewer

## Overview
Yo, listen up! This mind-blowing project is all about hooking you up with the dopest network visualization tool out there. We're talking about taking your topology data and turning it into a sick cytoscape graph model that you can peep using https://js.cytoscape.org. It's like having a virtual eye candy for your network!

Now, let's break it down into two rad sections:

TopoEngine: This bad boy is all about converting your topology data (right now it's Container Lab) into a sick cytoscape graph model. Once translated, you can visualize that bad boy and watch your network come to life.

CloudshellWrapper: Here's the deal, we've got a wicked wrapper for https://github.com/zephinzer/cloudshell. It's like having your own personal Xterm.js frontend that connects to a Go backend and gives you a shell right in your browser. Yeah, you heard it right, access your shell using your browser. It's like having a virtual command center at your fingertips. And guess what? If you're running CloudshellWrapper on the same host as containerlab, you can even access the nodes of containerlab through your browser. How cool is that?

But hey, keep in mind, exposing your shell via a browser can be risky business. We're just putting it out there, so if you decide to dive in, do it at your own risk. Stay rad, my friend!


## Quickstart
The simplest approach to utilise TopoViewer with Containerlab is to include the under the 'nodes:' section to a topology YAML file.

copy paste below start-up script, to deploy a Containerlab topology with topoviewer.

```Shell
bash -c "$(wget -qO - https://raw.githubusercontent.com/asadarafat/nokia-DataCenterFabric-lab/main/demo-deploy.sh)"
```

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
      <summary>Wireshark Client Helper</summary>
      <p>There are two type of suported client here, Windows version and MAC version, both of the clients can be find in "Setting Menu, TopoViewer Helper App". 
      </p>
      <ul>
        <li> For the Windows version, download and install the registry entry. </li>
        #### Prerequisite
        - Ensure PowerShell installed in Windows client side
        - Ensure the Wireshark is installed in client side.
        - Setup SSH keyless access to ContainerLab host
        - Copy  clabcapture.bat and clab-capture.reg into C:\\Program Files\\clab-client
        - Merge clab-capture.reg into Windows Registry, simply double click it.
        <li> For the MAC version, download and copy extracted app into Application folder. </li>
                Once the Wireshark client helper installed, simply click Cross Launch Button in link Properties.
                <img src="https://github.com/asadarafat/topoViewer/blob/development/docs/image/topoViewer-WiresharkHelperApp-MAC.gif"/>
      </ul>
     
    </details>

* **Link impairment**




## Tested Environment
- containerlab version:  0.41.2, 0.44.3, 0.46.0
- docker-ce version: 24.0.2
