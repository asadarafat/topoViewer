#!/bin/bash

# Trigger an error if non-zero exit code is encountered
set -e 

/opt/topoviewer/topoviewer clab --allowed-hostnames $ALLOWED_HOSTNAME --clab-user $CLAB_USER --clab-pass $CLAB_PASS --server-port $SERVER_PORT --topology-file-json local-bind/topo-file.json &