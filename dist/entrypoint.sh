#!/bin/bash

# Trigger an error if non-zero exit code is encountered
set -e 

/opt/topoviewer/topoviewer clab -H ${1} -p ${2} -u ${3} -j local-bind/topo-file.yaml
