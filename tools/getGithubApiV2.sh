#!/bin/bash

# Default values
GITHUB_TOKEN=""
SPECIFIC_VERSION=""

# Function to display usage information
usage() {
  echo "Usage: $0 [--github-token <GitHub_Personal_Access_Token>] [--version <Specific_Version>]"
  exit 1
}

# Function to check for jq installation
check_jq() {
  if ! command -v jq &>/dev/null; then
    echo "jq is not installed."
    echo "Please download and install jq from https://stedolan.github.io/jq/download/"
    exit 1
  fi
}

# Function to log messages with timestamps
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to fetch tags from GitHub API
fetch_tags() {
  local url="$1"
  local token="$2"
  local response
  if [ -n "$token" ]; then
    response=$(curl -H "Authorization: token $token" "$url")
  else
    response=$(curl "$url")
    if [[ "$response" == *'"message":"API rate limit exceeded'* ]]; then
      log "API rate limit exceeded. Please consider using a GitHub token for authentication."
      exit 1
    fi
  fi
  echo "$response"
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
    --github-token)
      GITHUB_TOKEN="$2"
      shift 2
      ;;
    --version)
      SPECIFIC_VERSION="$2"
      shift 2
      ;;
    *)
      echo "Invalid argument: $1"
      usage
      ;;
  esac
done

# Repository details
USER="asadarafat"
REPO="topoViewer"

# Ensure jq is installed
check_jq

# GitHub API URL for tags
API_URL="https://api.github.com/repos/$USER/$REPO/tags"
log "The API_URL is: $API_URL"

log "Fetching available versions...."
tags_response=$(fetch_tags "$API_URL" "$GITHUB_TOKEN")
tags=$(echo "$tags_response" | jq -r '.[] | select(.name | test("komodo") | not) | .name')

log "All available versions:"
echo "$tags"

# Convert the tags into an array
tags_array=($tags)

# Determine the version to download
if [ -z "$SPECIFIC_VERSION" ]; then
  LATEST_VERSION="${tags_array[0]}"
else
  LATEST_VERSION="$SPECIFIC_VERSION"
  # Check if the specified version exists
  if ! echo "${tags_array[@]}" | grep -qw "$LATEST_VERSION"; then
    log "Specified version $LATEST_VERSION not found. Available versions are:"
    echo "$tags"
    exit 1
  fi
fi

log "The version to install is $LATEST_VERSION"

# Pull the Docker image for the specified or latest version
pull_docker_image "$SPECIFIC_VERSION"

# Copy assets from the container to the host
copy_assets_from_container "$SPECIFIC_VERSION"

log "Installation complete. topoViewer version $SPECIFIC_VERSION is now available in /opt/topoviewer."

exit 0
