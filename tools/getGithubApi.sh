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

# Function to download the specified version
download_version() {
  local token="$1"
  local version="$2"
  local zip_url="$3"
  curl -L -o /tmp/$version.zip ${token:+-H "Authorization: token $token"} $zip_url
}

# Function to perform the installation
perform_installation() {
  local version="$1"
  sudo rm -rRf "/tmp/$version/" /opt/topoviewer/
  sudo mkdir "/tmp/$version"
  sudo unzip "/tmp/$version.zip" -d "/tmp/$version"
  sudo mv "/tmp/$version"/*/* "/tmp/$version"
  sudo rm -rRf /opt/topoviewer
  sudo mkdir /opt/topoviewer
  sudo cp -rR "/tmp/$version/dist/"* /opt/topoviewer/
  sudo ln -sf "/opt/topoviewer/topoviewer" /usr/bin/topoviewer
  sudo rm -rRf "/tmp/$version/" "/tmp/$version.zip"
  log " "
  log "topoViewer version $version is installed in /opt/topoviewer"
  log " "
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

# Construct the ZIP URL for the specified version
ZIP_URL="https://api.github.com/repos/$USER/$REPO/zipball/refs/tags/$LATEST_VERSION"
log "Downloading the version - $ZIP_URL"

# Download and install the specified version
download_version "$GITHUB_TOKEN" "$LATEST_VERSION" "$ZIP_URL"

# Perform Installation
log "Installing topoViewer"
perform_installation "$LATEST_VERSION"

exit 0
