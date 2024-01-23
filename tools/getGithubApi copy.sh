#!/bin/bash

# Default values
GITHUB_TOKEN=""

# Function to display usage information
usage() {
  echo "Usage: $0 [--github-token <GitHub_Personal_Access_Token>]"
  exit 1
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

# Check if jq is installed
if ! command -v jq &>/dev/null; then
  echo "jq is not installed."
  echo "Please download and install jq from https://stedolan.github.io/jq/download/"
  exit 1
fi

# Repository details
USER="asadarafat"
REPO="topoViewer"

# Continue with your application logic here
echo "jq is installed and available."

# GitHub API URL for tags
API_URL="https://api.github.com/repos/$USER/$REPO/tags"
echo "The API_URL is: $API_URL"

# Fetch tags using curl, grep, and awk
if [ -n "$GITHUB_TOKEN" ]; then
  tags=$(curl -H "Authorization: token $GITHUB_TOKEN" $API_URL | grep '"name":' | awk -F '"' '{print $4}')
else
  # tags=$(curl $API_URL | grep '"name":' | awk -F '"' '{print $4}')
  tags=$(curl $API_URL)
  echo "tags...  $tags" 
  # Check if the response contains an API rate limit exceeded message
  if [[ "$tags" == *'"message":"API rate limit exceeded'* ]]; then
    echo "API rate limit exceeded. Please consider using a GitHub token for authentication."
    exit 1

  else tags=$(curl $API_URL | grep '"name":' | awk -F '"' '{print $4}')
  fi
fi

# Convert the tags into an array
tags_array=($tags)

# Get the first element (index 0) of the array
LATEST_VERSION="${tags_array[0]}"

echo "The latest version is $LATEST_VERSION"
echo " "



if [ -n "$GITHUB_TOKEN" ]; then
  json_data=$(curl -s -H "Authorization: token $GITHUB_TOKEN" $API_URL)

  # Extract the first element using jq
  LATEST_VERSION_zip_url=$(echo "$json_data" | jq '.[0]' |  jq -r '.zipball_url')
  curl -o /tmp/$LATEST_VERSION.zip -L -L -H "Authorization: token $GITHUB_TOKEN" $LATEST_VERSION_zip_url

else
  json_data=$(curl $API_URL)

  # Check if the response contains an API rate limit exceeded message
  if [[ "$json_data" == *'"message":"API rate limit exceeded'* ]]; then
    echo "API rate limit exceeded. Please consider using a GitHub token for authentication."
    exit 1

  else 
      # Extract the first element using jq
      LATEST_VERSION_zip_url=$(echo "$json_data" | jq '.[0]' |  jq -r '.zipball_url')
      curl -o /tmp/$LATEST_VERSION.zip -L -L $LATEST_VERSION_zip_url
  fi
fi



# Print the first element
echo "Downloading the latest version - $LATEST_VERSION_zip_url"
echo "######"

# getFile() {
#   curl -o /tmp/$LATEST_VERSION.zip -L -L -H "Authorization: token $GITHUB_TOKEN" $LATEST_VERSION_zip_url
# }
# getFile

installFile() {
    sudo rm -rRf /tmp/$LATEST_VERSION/
    sudo rm -rRf /opt/topoviewer/

    sudo mkdir /tmp/$LATEST_VERSION
    sudo unzip /tmp/$LATEST_VERSION.zip -d /tmp/$LATEST_VERSION
    sudo mv /tmp/$LATEST_VERSION/*/* /tmp/$LATEST_VERSION
    sudo rm -rRf /opt/topoviewer
    sudo mkdir /opt/topoviewer
    sudo cp -rR /tmp/$LATEST_VERSION/dist/* /opt/topoviewer/
    sudo ln -sf /opt/topoviewer/topoviewer /usr/bin/topoviewer

    sudo rm -rRf /tmp/$LATEST_VERSION/
    sudo rm -rRf /tmp/$LATEST_VERSION.zip
    
    echo " "
    echo "###### topoViewer is installed ######"
    echo " "
    topoviewer --version
    echo " "
}
installFile

exit 0
