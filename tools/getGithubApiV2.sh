#!/bin/bash

# Default values
SPECIFIC_VERSION=""

# Function to display usage information
usage() {
  echo "Usage: $0 [--version <Specific_Version>] [--help] [--list]"
}

# Function to list versions
versions() {
  echo "Available versions on GitHub:"
  git ls-remote --tags https://github.com/asadarafat/topoViewer.git | grep -v komodo | sed -n 's|.*refs/tags/\(nightly.*\)|\1|p' | sort
}

# Function to log messages with timestamps
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to pull the Docker image
pull_docker_image() {
  local version="$1"
  local image="ghcr.io/asadarafat/topoviewer:$version"

  log "Pulling Docker image $image..."
  docker pull "$image"
}

# Function to copy the assets from the Docker container to the host
copy_assets_from_container() {
  local version="$1"
  local container_name="topoviewer_temp_container"
  local image="ghcr.io/asadarafat/topoviewer:$version"

  # Create a temporary container from the image
  log "Creating temporary container from image $image..."
  docker create --name "$container_name" "$image"

  # Copy the contents of /opt/topoviewer from the container to /opt/topoviewer on the host
  log "Copying assets from /opt/topoviewer in the container to /opt/topoviewer on the host..."
  sudo rm -rf /opt/topoviewer
  sudo mkdir -p /opt/topoviewer
  docker cp "$container_name:/opt/topoviewer/." /opt/topoviewer/

  # Remove the temporary container
  log "Removing temporary container..."
  docker rm "$container_name"

  # Create a symbolic link for the binary (if applicable)
  if [ -f "/opt/topoviewer/topoviewer" ]; then
    sudo ln -sf "/opt/topoviewer/topoviewer" /usr/bin/topoviewer
  fi

  log "Assets have been successfully copied to /opt/topoviewer."
}

# Parse command-line arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --version)
      SPECIFIC_VERSION="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    --list)
      versions
      exit 0
      ;;
    *)
      echo "Invalid argument: $1"
      usage
      exit 1
      ;;
  esac
done

# Repository details
USER="asadarafat"
REPO="topoViewer"

# GitHub API URL for tags
API_URL="https://api.github.com/repos/$USER/$REPO/tags"
log "The API_URL is: $API_URL"

log "Fetching available versions...."
tags=$(git ls-remote --tags https://github.com/$USER/$REPO.git | grep -v komodo | sed -n 's|.*refs/tags/\(nightly.*\)|\1|p' | sort -r)

# Convert the tags into an array
tags_array=($tags)

# Determine the version to download
if [ -z "$SPECIFIC_VERSION" ]; then
  # Get latest version
  VERSION_TO_INSTALL="${tags_array[0]}"
else
  VERSION_TO_INSTALL="$SPECIFIC_VERSION"
  # Check if the specified version exists
  if ! echo "${tags_array[@]}" | grep -qw "$VERSION_TO_INSTALL"; then
    log "Specified version $VERSION_TO_INSTALL not found. Available versions are:"
    echo "$tags"
    exit 1
  fi
fi

log "The version to install is $VERSION_TO_INSTALL"

# Pull the Docker image for the specified or latest version
pull_docker_image "$VERSION_TO_INSTALL"

# Copy assets from the container to the host
copy_assets_from_container "$VERSION_TO_INSTALL"

log "Installation complete. topoViewer version $VERSION_TO_INSTALL is now available in /opt/topoviewer."

exit 0
