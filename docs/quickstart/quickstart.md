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
      image: ghcr.io/asadarafat/topoviewer:nightly-24.10.30
      ports:
        - ${TOPOVIEWER_SERVER_PORT}:${TOPOVIEWER_SERVER_PORT}
      startup-delay: 5
      binds:
        - /var/run/docker.sock:/var/run/docker.sock:ro
        - clab-demo-output.yaml:/opt/topoviewer/local-bind/clab-demo-output.yaml:ro
      env:
        ALLOWED_HOSTNAME: "${TOPOVIEWER_HOST_CLAB}"
        CLAB_USER: "${TOPOVIEWER_HOST_CLAB_USER}"
        CLAB_PASS: "${TOPOVIEWER_HOST_CLAB_PASS}"
        SERVER_PORT: "${TOPOVIEWER_SERVER_PORT}"
        CLAB_TOPO_YAML: clab-demo-output.yaml
      labels:
        topoviewer-role: controller
      exec:
        - '/opt/topoviewer/entrypoint.sh'
    ...
```

This configuration file sets up the environment and container bindings necessary for topoViewer to interact with the network topology.

