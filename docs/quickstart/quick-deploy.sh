#!/bin/bash

# Download the file and set it as TOPOVIEWER_CLAB_TOPO_YAML
TOPOVIEWER_CLAB_TOPO_YAML="clab-demo-output.yaml"
curl -o "$TOPOVIEWER_CLAB_TOPO_YAML" -L "https://raw.githubusercontent.com/asadarafat/topoViewer/refs/heads/development/docs/quickstart/clab-demo.yaml"
if [[ $? -ne 0 ]]; then
  echo "Failed to download the topology YAML file."
  exit 1
fi
echo "Downloaded topology file: $TOPOVIEWER_CLAB_TOPO_YAML"

export TOPOVIEWER_CLAB_TOPO_YAML

# Function to prompt user and save input as environment variables
ask_for_input() {
  local var_name=$1
  local prompt_message=$2
  local hide_input=$3

  if [[ "$hide_input" == "true" ]]; then
    read -s -p "$prompt_message: " input_value
    echo # move to a new line after hidden input
  else
    read -p "$prompt_message: " input_value
  fi
  
  export $var_name="$input_value"
}

# Prompt for the host input and parse if it contains a port
read -p "Enter the clab-server-hostname:port (e.g., nsp-clab1.nice.nokia.net:8081): " host_input
if [[ $host_input == *:* ]]; then
  TOPOVIEWER_HOST_CLAB="${host_input%:*}"
  TOPOVIEWER_SERVER_PORT="${host_input##*:}"
else
  TOPOVIEWER_HOST_CLAB="$host_input"
  TOPOVIEWER_SERVER_PORT="default_port" # Replace with a default port if needed
fi
export TOPOVIEWER_HOST_CLAB
export TOPOVIEWER_SERVER_PORT

# Prompting for remaining inputs
ask_for_input "TOPOVIEWER_HOST_CLAB_USER" "Enter the CLAB user"
ask_for_input "TOPOVIEWER_HOST_CLAB_PASS" "Enter the CLAB password" true

# Display all set environment variables (excluding password)
echo -e "\nEnvironment variables set:"
echo "TOPOVIEWER_HOST_CLAB=$TOPOVIEWER_HOST_CLAB"
echo "TOPOVIEWER_SERVER_PORT=$TOPOVIEWER_SERVER_PORT"
echo "TOPOVIEWER_HOST_CLAB_USER=$TOPOVIEWER_HOST_CLAB_USER"
echo "TOPOVIEWER_CLAB_TOPO_YAML=$TOPOVIEWER_CLAB_TOPO_YAML"

# Generate the final YAML file from the downloaded template file
TEMPLATE_FILE="$TOPOVIEWER_CLAB_TOPO_YAML"
OUTPUT_FILE="clab-demo-output.yaml"
HIDDEN_BACKUP_FILE=".$OUTPUT_FILE.bak"  # Define the hidden backup file

if [[ ! -f $TEMPLATE_FILE ]]; then
  echo "Template file $TEMPLATE_FILE not found."
  exit 1
fi

# Use envsubst to replace placeholders in the template file with actual values
envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE with the substituted environment variables."

# Run the clab deploy command with the generated file
echo "Running clab deploy with the generated configuration..."
sudo clab deploy -t "$OUTPUT_FILE" --reconfigure

# Obfuscate the CLAB_PASS in both output files
sed -i "s/CLAB_PASS: \"$TOPOVIEWER_HOST_CLAB_PASS\"/CLAB_PASS: \"****\"/" "$OUTPUT_FILE"
sed -i "s/CLAB_PASS: \"$TOPOVIEWER_HOST_CLAB_PASS\"/CLAB_PASS: \"****\"/" "$HIDDEN_BACKUP_FILE"

# echo "Obfuscated the CLAB_PASS in $OUTPUT_FILE and the hidden backup $HIDDEN_BACKUP_FILE."
