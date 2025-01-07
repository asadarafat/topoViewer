#!/bin/bash

# Update and install required packages
apt-get update && apt-get install -y openssh-server docker-compose

# Start SSH service
service ssh start

# Deploy EdgeShark using Docker Compose
curl -sL https://github.com/siemens/edgeshark/raw/main/deployments/wget/docker-compose.yaml | DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose -f - up -d

# Change SSH port to 22 and restart service
sed -i 's/^Port 2222/Port 22/' /etc/ssh/sshd_config
service ssh restart

# Set password for vscode user
echo "vscode:vscode" | chpasswd

# Update SSH key exchange algorithms
echo "KexAlgorithms diffie-hellman-group1-sha1,curve25519-sha256@libssh.org,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521,diffie-hellman-group-exchange-sha256,diffie-hellman-group14-sha1" >> /etc/ssh/ssh_config

# Export environment variables for TopoViewer
export TOPOVIEWER_HOST_CLAB="localhost"
export TOPOVIEWER_HOST_CLAB01="127.0.0.1"
export TOPOVIEWER_CLAB_ADDRESS="172.20.20.1"
export TOPOVIEWER_HOST_CLAB_USER="vscode"
export TOPOVIEWER_HOST_CLAB_PASS="vscode"
export TOPOVIEWER_SERVER_PORT="8080"
export TOPOVIEWER_CLAB_TOPO_YAML="clab-demo-output.yaml"

# Upgrade containterlab
clab version upgrade

# Delete existing TOPOVIEWER_CLAB_TOPO_YAML
rm -f $TOPOVIEWER_CLAB_TOPO_YAML

# Download the TopoViewer YAML file
curl -o "$TOPOVIEWER_CLAB_TOPO_YAML" -L "https://raw.githubusercontent.com/asadarafat/topoViewer/refs/heads/development/docs/quickstart/clab-demo.yaml"

# Deploy the topology using containerlab
clab deploy -t "$TOPOVIEWER_CLAB_TOPO_YAML" --debug
