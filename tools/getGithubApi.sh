#!/bin/bash

# Default values
GITHUB_TOKEN=""

# Function to display usage information
usage() {
  echo "Usage: $0 [--github-token <GitHub_Personal_Access_Token>]"
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

# Usage example
# log "This is a log message."


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

# Function to install the latest version
download_latest_version() {
  local token="$1"
  local latest_version="$2"
  local zip_url="$3"  
  # echo "executing... curl -L --compressed ${token:+-H "Authorization: token $token"} $zip_url -o /tmp/$latest_version.zip "
  curl -L -o /tmp/$latest_version.zip ${token:+-H "Authorization: token $token"} $zip_url
}

# Function to perform the installation
perform_installation() {
  local token="$1"
  local latest_version="$2"
  sudo rm -rRf "/tmp/$latest_version/" /opt/topoviewer/
  sudo mkdir "/tmp/$latest_version"
  sudo unzip "/tmp/$latest_version.zip" -d "/tmp/$latest_version"
  sudo mv "/tmp/$latest_version"/*/* "/tmp/$latest_version"
  sudo rm -rRf /opt/topoviewer
  sudo mkdir /opt/topoviewer
  sudo cp -rR "/tmp/$latest_version/dist/"* /opt/topoviewer/
  sudo ln -sf "/opt/topoviewer/topoviewer" /usr/bin/topoviewer
  sudo rm -rRf "/tmp/$latest_version/" "/tmp/$latest_version.zip"
  log " "
  log "topoViewer version $latest_version is installed in /opt/topoviewer"
  log " "
}

# Parse command-line arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --github-token)
      GITHUB_TOKEN="$2"
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

# Continue with your application logic here
check_jq

# GitHub API URL for tags
API_URL="https://api.github.com/repos/$USER/$REPO/tags"
echo "The API_URL is: $API_URL"

# Fetch tags using curl, grep, and awk

log "Fetching available version...." 
tags_response=$(fetch_tags "$API_URL" "$GITHUB_TOKEN")
tags=$(echo "$tags_response" | jq -r '.[] | select(.name | test("komodo") | not) | .name')

log "All available version:"
echo "$tags"

# Convert the tags into an array
tags_array=($tags)

# Get the first element (index 0) of the array
LATEST_VERSION="${tags_array[0]}"


log "The latest version is $LATEST_VERSION"


# Extract the ZIP URL using jq
# LATEST_VERSION_zip_url=$(echo "$tags_response" | jq -r '.[].zipball_url')

LATEST_VERSION_zip_url=https://api.github.com/repos/$USER/$REPO/zipball/refs/tags/$LATEST_VERSION

# Print the first element
log "Downloading the latest version - $LATEST_VERSION_zip_url"

# Download and install the latest version
download_latest_version "$GITHUB_TOKEN" "$LATEST_VERSION" "$LATEST_VERSION_zip_url"

#Perform Installation
log "Installing topoViewer"
perform_installation "$GITHUB_TOKEN" "$LATEST_VERSION" 

exit 0
