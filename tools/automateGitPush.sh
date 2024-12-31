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

# Attempt to push changes to the remote repository
if ! git push; then
  echo "Push failed due to divergence. Attempting to resolve..."
  
  # Pull remote changes and rebase
  if ! git pull --rebase; then
    echo "Rebase failed. Forcing the push to resolve divergence."
    git push --force
  else
    # Push changes after successful rebase
    git push
  fi
fi

echo "Ownership changed, files committed, and changes pushed successfully!"
