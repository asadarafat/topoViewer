## Overview

`TopoViewer` is a network visualization tool that converts topology data into a Cytoscape graph model, allowing you to visualize your network using [Cytoscape.js](https://js.cytoscape.org).

The project is divided into two main components:

- **TopoEngine**: Converts topology data (currently supports Container Lab) into a Cytoscape graph model. This component handles the core logic for processing and visualizing network topologies, including parsing topology files and generating visual representations.

- **CloudshellWrapper**: A wrapper for [cloudshell](https://github.com/zephinzer/cloudshell) that provides an Xterm.js frontend connected to a Go backend, allowing you to access your shell via a browser. If CloudshellWrapper is running on the same host as Containerlab, it can also access the nodes of Containerlab through the browser.

> **Note**: Exposing your shell via a browser can be risky. Use at your own risk.

The codebase is organized into several folders with the prefix `go_`, each serving a specific purpose:

- **go_cloudshellwrapper**: Contains the main logic for running `TopoViewer`. Key files include:
  - `cmd/main.go`: The entry point for running `TopoViewer`.
  - `cmdClab.go`: Handles CLAB-specific commands.
  - `cmdNsp.go`: Handles NSP-specific commands.
  - Additionally, the `clabHandlers` directory contains handlers specific to Containerlab operations.

- **go_topoengine**: Contains the core logic for processing and visualizing network topologies. This includes parsing topology files and generating visual representations.

- **go_xtermjs**: Integrates `xterm.js` for terminal emulation within the `TopoViewer`interface. This allows users to interact with the terminal directly from the web interface.

- **go_tools**: Contains various utility functions and tools used by `TopoViewer`. 