#!/bin/bash

# Change ownership of all files in the current directory recursively to the current user
sudo chown -R $(whoami):$(whoami) *

# Commit changes to the Git repository
git add .
git commit -m "Automated commit on $(date +'%Y-%m-%d %H:%M:%S')"

# Push changes to the remote repository
git push

echo "Ownership changed, files committed, and changes pushed successfully!"
