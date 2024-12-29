#!/bin/bash

# Parse optional commit message
COMMIT_MESSAGE="Automated commit on $(date +'%Y-%m-%d %H:%M:%S')"
while getopts "m:" opt; do
  case $opt in
    m)
      COMMIT_MESSAGE=$OPTARG
      ;;
    *)
      echo "Usage: $0 [-m <commit-message>]"
      exit 1
      ;;
  esac
done

# Change ownership of all files in the current directory recursively to the current user
sudo chown -R $(whoami):$(whoami) *

# Commit changes to the Git repository
git add .
git commit -m "$COMMIT_MESSAGE"

# Push changes to the remote repository
git push

echo "Ownership changed, files committed, and changes pushed successfully!"
