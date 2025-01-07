#!/bin/bash
/opt/topoviewer/topoviewer clab --allowed-hostnames $ALLOWED_HOSTNAME,$ALLOWED_HOSTNAME01 --clab-user $CLAB_USER --clab-pass $CLAB_PASS --server-port $SERVER_PORT --topology-file-yaml local-bind/$CLAB_TOPO_YAML --clab-server-address $CLAB_ADDRESS_SERVER &