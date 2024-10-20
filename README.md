## Overview

[`topoViewer`] is a network visualization tool that converts topology data into a Cytoscape graph model, allowing you to visualize your network using [Cytoscape.js](https://js.cytoscape.org).

The project is divided into two main components:

- **TopoEngine**: Converts topology data (currently supports Container Lab) into a Cytoscape graph model. This component handles the core logic for processing and visualizing network topologies, including parsing topology files and generating visual representations.

- **CloudshellWrapper**: A wrapper for [cloudshell](https://github.com/zephinzer/cloudshell) that provides an Xterm.js frontend connected to a Go backend, allowing you to access your shell via a browser. If CloudshellWrapper is running on the same host as Containerlab, it can also access the nodes of Containerlab through the browser.

> **Note**: Exposing your shell via a browser can be risky. Use at your own risk.

The codebase is organized into several folders with the prefix `go_`, each serving a specific purpose:

- **go_cloudshellwrapper**: Contains the main logic for running [`topoViewer`]. Key files include:
  - `cmd/main.go`: The entry point for running [`topoViewer`].
  - `cmdClab.go`: Handles CLAB-specific commands.
  - `cmdNsp.go`: Handles NSP-specific commands.
  - `utils.go`: Contains utility functions such as `createMemoryLog` and `createRequestLog`.
  - Additionally, the `clabHandlers` directory contains handlers specific to Containerlab operations.

- **go_topoengine**: Contains the core logic for processing and visualizing network topologies. This includes parsing topology files and generating visual representations.

- **go_xtermjs**: Integrates `xterm.js` for terminal emulation within the [`topoViewer`]interface. This allows users to interact with the terminal directly from the web interface.

- **go_tools**: Contains various utility functions and tools used by [`topoViewer`]. 


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
sudo go run go_cloudshellwrapper/cmd/main.go clab --allowed-hostnames 149.204.21.68 --clab-user aarafat  --server-port 8081  --topology-file-json  /home/aarafat/nokia-ServiceProvider-lab/clab-nokia-ServiceProvider/topology-data.json --deployment-type colocated
 ```
 
 ## Quickstart - colocated with Containerlab 
```Shell
bash -c "$(wget -qO - https://raw.githubusercontent.com/asadarafat/topoViewer/development/tools/getGithubApi.sh)"
```