## Overview

`TopoViewer` is a network visualization tool that converts topology data into a Cytoscape graph model, allowing you to visualize your network using [Cytoscape.js](https://js.cytoscape.org).

![Group Visualization](./docs/containerlab-topology-definition-enhancement/containerlab-topology-definition-group.png)


The project is structured with a Go-based backend that processes and visualizes network topologies, converting data (currently supporting Container Lab) into a graph model for display. The frontend is a web application built with HTML and JavaScript libraries, including Cytoscape.js for graph visualization and Xterm.js for interactive shell access in the browser. When deployed on the same host as Container Lab, the application can directly access Container Lab nodes through the browser interface.

The codebase is organized into several folders prefixed with `go_`, each serving a specific purpose:

- **go_cloudshellwrapper**: Contains the main logic for running TopoViewer, including:
  - `cmd/main.go` as the entry point for TopoViewer,
  - `cmdClab.go` for handling CLAB-specific commands,
  - `cmdNsp.go` for NSP-specific commands,
  - and the `clabHandlers` directory, which provides handlers specific to Container Lab operations.

- **go_topoengine**: Manages the core logic for processing and visualizing network topologies, from parsing topology files to generating visual representations.

- **go_xtermjs**: Integrates Xterm.js to provide terminal emulation within the TopoViewer interface, enabling direct interaction with the terminal through the web interface.

- **go_tools**: Contains various utility functions and tools essential for TopoViewer’s operations.


## Container Lab Topology Features

TopoViewer provides specialized support for Container Lab topologies, enhancing network visualization and usability. The following guides and features are tailored for Container Lab users:

### Quick Start

The **Quick Start Guide** offers step-by-step instructions for setting up and using TopoViewer with Container Lab topologies. Refer to the [Quick Start Guide](https://github.com/asadarafat/topoViewer/blob/development/docs/quickstart/quickstart.md) for details.

### Enhanced Topology Definition

TopoViewer supports [enhanced containerlab topology definitions](docs/containerlab-topology-definition-enhancement/readme.md), introducing additional features to make network visualizations more intuitive and user-friendly.

### User TaskFlow

The **User TaskFlow Guide** provides a detailed walkthrough for leveraging TopoViewer’s features with Container Lab topologies. See the [User TaskFlow Guide](https://github.com/asadarafat/topoViewer/blob/development/docs/user-taskflow/readme.md) for comprehensive instructions.
