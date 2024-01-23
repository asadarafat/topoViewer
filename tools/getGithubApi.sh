#!/bin/bash

# Repository details
USER="asadarafat"
REPO="topoViewer"

if ! command -v jq &>/dev/null; then
  echo "jq is not installed."
  echo "Please download and install jq from https://stedolan.github.io/jq/download/"
  exit 1
fi

# Continue with your application logic here
echo "jq is installed and available."

# GitHub API URL for tags
API_URL="https://api.github.com/repos/$USER/$REPO/tags"
echo "The API_URL is: $API_URL"

# Fetch tags using curl, grep, and awk
tags=$(curl -s -H "Authorization: token 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" $API_URL | grep '"name":' | awk -F '"' '{print $4}')

# echo "$tags"
# echo " "


# Convert the tags into an array
tags_array=($tags)

# Get the first element (index 0) of the array
LATEST_VERSION="${tags_array[0]}"

echo "The latest version is $LATEST_VERSION"
echo " "

json_data=$(curl -s -H "Authorization: token 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" $API_URL )

# Extract the first element using jq
LATEST_VERSION_zip_url=$(echo "$json_data" | jq '.[0]' |  jq -r '.zipball_url')

# Print the first element
echo "Downloading the latest version - $LATEST_VERSION_zip_url"
echo "######"



getFile() {
  curl -o /tmp/$LATEST_VERSION.zip -L -L -H "Authorization: token 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" $LATEST_VERSION_zip_url
}
getFile

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