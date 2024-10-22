#!/bin/bash

# Trigger an error if non-zero exit code is encountered
set -e 

# Function to check if both 'nodes' and 'links' have entries
check_file_content() {
  jq -e '.nodes | length > 0' local-bind/topo-file.json >/dev/null 2>&1
}

# Wait until the JSON file contains the required 'nodes' and 'links' entries
while ! check_file_content; do
  echo "Waiting for 'nodes' and 'links' entries in local-bind/topo-file.json..."
  sleep 5  # Wait for 5 seconds before checking again
done

# Once the content is found, execute the command
/opt/topoviewer/topoviewer clab --allowed-hostnames $ALLOWED_HOSTNAME --clab-user $CLAB_USER --clab-pass $CLAB_PASS --server-port $SERVER_PORT --topology-file-json local-bind/topo-file.json &
