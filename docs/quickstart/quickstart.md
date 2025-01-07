# topoViewer Quick Start

This quick start guide will help you deploy topoViewer using Containerlab and get it running in no time.

## Prerequisites

1. **Linux Environment:** Ensure you're running this on a Linux-based OS.
2. **Containerlab:** Install [Containerlab](https://containerlab.dev/) on your system if it's not already installed.
3. **Docker:** Make sure Docker is installed and running.

## Quick Start

1. Run the following command in your Linux terminal to deploy the topology. This script will:
   - Download the necessary `clab-demo.yaml` file.
   - Configure and launch the topoViewer container with specified environment variables.
   
   ```bash
   bash -c "$(curl -sL https://raw.githubusercontent.com/asadarafat/topoViewer/refs/heads/development/docs/quickstart/quick-deploy.sh)"
   ```

2. **What the Script Does**:
   - **Downloads the `clab-demo.yaml` file**: Defines the network topology for the topoViewer deployment.
   - **Prompts for User Configuration**:
     - Enter the hostname and port for the Containerlab server.
     - Provide the Containerlab username and password (password input is hidden for security).
   - **Generates Final Configuration File**: Substitutes placeholders with the actual values in `clab-demo.yaml` and saves it as `clab-demo-output.yaml`.
   - **Deploys with Containerlab**: Runs `clab deploy` to start the defined topology.

### `clab-demo.yaml` Structure
The `clab-demo.yaml` file configures the main `topoviewer` container and additional network elements, including Spine and Leaf nodes. Here’s an outline of the main `topoviewer` node:

```yaml
topology:
  nodes:
    topoviewer:
      kind: linux
      image: ghcr.io/asadarafat/topoviewer:nightly-25.01.09
      ports:
        - 8080:8080
      startup-delay: 2
      binds:
        - /var/run/docker.sock:/var/run/docker.sock:ro
        - ${TOPOVIEWER_CLAB_TOPO_YAML}:/opt/topoviewer/local-bind/${TOPOVIEWER_CLAB_TOPO_YAML}:ro
      env:
        ### These are the environment variables for topoviewer container
        ALLOWED_HOSTNAME: "${TOPOVIEWER_HOST_CLAB}" ## TopoViewer server hostname.
        CLAB_ADDRESS_SERVER: "${TOPOVIEWER_CLAB_ADDRESS}" ## Option to set containerlab server, 172.20.20.1 is containerlab's management network default-gateway. If this not set ALLOWED_HOSTNAME will be used as CLAB_ADDRESS_SERVER.
        CLAB_USER: "${TOPOVIEWER_HOST_CLAB_USER}"
        CLAB_PASS: "${TOPOVIEWER_HOST_CLAB_PASS}"
        SERVER_PORT: "${TOPOVIEWER_SERVER_PORT}"
        CLAB_TOPO_YAML: ${TOPOVIEWER_CLAB_TOPO_YAML}
      labels:
        topoViewer-role: controller
      exec:
        ## This is the entrypoint script of topoviewer container
        - '/opt/topoviewer/entrypoint.sh'
    ...
```

This configuration file sets up the environment and container bindings necessary for topoViewer to interact with the network topology.

