#!/bin/bash

# Trigger an error if non-zero exit code is encountered
set -e 

/opt/topoviewer/topoviewer clab -H 149.204.21.68  -p 8080 -u suuser -j local-bind/topo-file.yaml