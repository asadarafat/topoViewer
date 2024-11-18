// Declare global variables at the top
var yamlTopoContent;

// CLAB EDITOR
async function showPanelContainerlabEditor(event) {
    // Get the YAML content from backend
    getYamlTopoContent(yamlTopoContent)

    // Get all elements with the class "panel-overlay"
    var panelOverlays = document.getElementsByClassName("panel-overlay");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < panelOverlays.length; i++) {
        panelOverlays[i].style.display = "none";
    }
    document.getElementById("panel-clab-editor").style.display = "block";
}

// / logMessagesPanel Function to add a click event listener to the close button
document.getElementById("panel-clab-editor-close-button").addEventListener("click", () => {
    document.getElementById("panel-clab-editor").style.display = "none";
});

function clabEditorLoadFile() {
    const fileInput = document.getElementById('panel-clab-editor-file-input');
    const textarea = document.getElementById('panel-clab-editor-text-area');

    // Trigger the file input's file browser dialog
    fileInput.click();

    // Listen for when the user selects a file
    fileInput.onchange = function() {
        if (fileInput.files.length === 0) {
            return; // No file selected
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            textarea.value = event.target.result;
        };

        reader.readAsText(file);
    };
}



function clabEditorAddNode(nodeId, nodeName = "Spine-01", kind ='nokia_srlinux', image = 'ghcr.io/nokia/srlinux:latest', group = 'group-01', topoViewerRole = 'dcgw') {
    if (!kind || !image || !group || !topoViewerRole) {
        console.error("All parameters (kind, image, group, topoViewerRole) must be provided.");
        return;
    }

    const textarea = document.getElementById('panel-clab-editor-text-area');
    nodeId = (`### ${nodeId}`);
    
    // Updated regex pattern to capture nodeName if it exists under the specified nodeId
    // const existingNodeRegex = new RegExp(`###\\s*${nodeId}\\s*\\n\\s*(\\S+):`, 'm');
    const existingNodeRegex = new RegExp(`${nodeId}\\s*\\n\\s+(\\S+):`, 'm');

    const match = textarea.value.match(existingNodeRegex);
    const oldNodeName = match ? match[1] : null;

    console.log("oldNodeName: ", oldNodeName);  // Debug: log oldNodeName

    // Node definition template with the new nodeName
    const nodeDefinition = 
`${nodeId}
    ${nodeName}:
      kind: ${kind}
      image: ${image}
      group: ${group}
      labels:
        topoViewer-role: ${topoViewerRole}

`;

    // Insert or update the node definition in the "nodes" section
    const nodesSectionIndex = textarea.value.search(/^\s*nodes:/m);
    const nodeRegex = new RegExp(`\\s*${nodeId}\\s*\\n(\\s*.*\\n)*?\\s*topoViewer-role: .*\\n`, 'g');

    if (nodesSectionIndex !== -1) {
        const insertionIndex = textarea.value.indexOf("  links:", nodesSectionIndex);
        const endOfNodesSection = insertionIndex !== -1 ? insertionIndex : textarea.value.length;
        const nodesSection = textarea.value.slice(nodesSectionIndex, endOfNodesSection);

        if (nodesSection.match(nodeRegex)) {
            // Replace the existing node
            textarea.value = textarea.value.replace(nodeRegex, 
                `\n\n${nodeId}\n    ${nodeName}:\n      kind: ${kind}\n      image: ${image}\n      group: ${group}\n      labels:\n        topoViewer-role: ${topoViewerRole}\n`);
        } else {
            // Insert the new node at the end of the nodes section
            textarea.value = textarea.value.slice(0, endOfNodesSection) + nodeDefinition + textarea.value.slice(endOfNodesSection);
        }
    } else {
        // Append if "nodes" section doesn't exist
        textarea.value += (textarea.value.endsWith("\n") ? "" : "\n") + nodeDefinition;
    }

    // Update the links section if oldNodeName exists
    if (oldNodeName && oldNodeName !== nodeName) {
        // Updated regex to match oldNodeName in any position in the endpoints array
        const linksRegex = new RegExp(`(endpoints:\\s*\\[\\s*".*?)(\\b${oldNodeName}\\b)(:.*?)\\]`, 'g');
        textarea.value = textarea.value.replace(linksRegex, `$1${nodeName}$3]`);
    }

    yamlTopoContent = textarea.value;
}

async function clabEditorSaveYamlTopo() {
    const textarea = document.getElementById('panel-clab-editor-text-area');
    clabTopoYamlEditorData = textarea.value;
    console.log("clabTopoYamlEditorData - yamlTopoContent: ", clabTopoYamlEditorData)

    // dump clabTopoYamlEditorDatal to be persisted to clab-topo.yaml
    const endpointName = '/clab-save-topo-yaml';
    
    try {
        // Send the enhanced node data directly without wrapping it in an object
        const response = await sendRequestToEndpointPost(endpointName, [clabTopoYamlEditorData]);
        console.log('Node data saved successfully', response);
    } catch (error) {
        console.error('Failed to save yaml topo:', error);
    }

}



function clabEditorAddEdge(sourceCyNode, sourceNodeEndpoint, targetCyNode, targetNodeEndpoint) {
    const textarea = document.getElementById('panel-clab-editor-text-area');

    sourceNodeName = sourceCyNode.data("name")
    targetNodeName = targetCyNode.data("name")

    
    // Edge definition with dynamic endpoints array
    const edgeDefinition = `
    - endpoints: ["${sourceNodeName}:${sourceNodeEndpoint}", "${targetNodeName}:${targetNodeEndpoint}"]`;

    // Locate the 'links' section and insert the edge definition at the end of it
    const linksIndex = textarea.value.indexOf("  links:");
    if (linksIndex !== -1) {
        // Find the end of the links section or where the next section begins
        const nextSectionIndex = textarea.value.indexOf("\n", linksIndex);
        const insertionIndex = nextSectionIndex !== -1 ? nextSectionIndex : textarea.value.length;

        // Insert the edge definition at the end of the links section
        textarea.value = textarea.value.slice(0, insertionIndex) + edgeDefinition + textarea.value.slice(insertionIndex);
    } else {
        // If no 'links' section exists, append the edge definition at the end of the content
        textarea.value += "\n  links:" + edgeDefinition;
    }
}

// NODE EDITOR START
// NODE EDITOR START
// NODE EDITOR START

// var yamlTopoContent

async function showPanelNodeEditor(node) {
    try {
        // Remove all Overlayed Panels
        const panelOverlays = document.getElementsByClassName("panel-overlay");
        Array.from(panelOverlays).forEach(panel => {
            panel.style.display = "none";
        });

        console.log("showPanelNodeEditor - node ID:", node.data("id"));

        // Set the node Name in the editor
        const nodeNameInput = document.getElementById("panel-node-editor-name");
        if (nodeNameInput) {
            nodeNameInput.value = node.data("id"); //defaulted by node id
        }

        // Set the node Id in the editor
        const nodeIdLabel = document.getElementById("panel-node-editor-id");
        if (nodeIdLabel) {
            nodeIdLabel.textContent = node.data("id");
        }

        // Set the node image in the editor
        const nodeImageLabel = document.getElementById("panel-node-editor-image");
        if (nodeImageLabel) {
            nodeImageLabel.value = 'ghcr.io/nokia/srlinux:latest';
        }

        // Set the node image in the editor
        const nodeGroupLabel = document.getElementById("panel-node-editor-group");
        if (nodeGroupLabel) {
            nodeGroupLabel.value = 'data-center';
        }

        // Display the node editor panel
        const nodeEditorPanel = document.getElementById("panel-node-editor");
        if (nodeEditorPanel) {
            nodeEditorPanel.style.display = "block";
        }


        // Fetch JSON schema from the backend
        const url = "js/clabJsonSchema-v0.59.0.json";
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const jsonData = await response.json();

            // Get kind enums from the JSON data
            const { kindOptions } = getKindEnums(jsonData);
            console.log('Kind Enum:', kindOptions);

            // Populate the dropdown with fetched kindOptions
            populateKindDropdown(kindOptions);

            // Populate the dropdown with fetched topoViwerRoleOptions
            var  topoViwerRoleOptions = ['bridge', 'controller', 'dcgw', 'router', 'leaf', 'pe', 'pon', 'rgw', 'server','super-spine', 'spine'];
            populateTopoViewerRoleDropdown(topoViwerRoleOptions)

            // List type enums based on kind pattern
            const typeOptions = getTypeEnumsByKindPattern(jsonData, '(srl|nokia_srlinux)'); // aarafat-tag: to be added to the UI
            console.log('Type Enum for (srl|nokia_srlinux):', typeOptions);

        } catch (error) {
            console.error("Error fetching or processing JSON data:", error.message);
            throw error;
        }

    } catch (error) {
        console.error("Error in showPanelNodeEditor:", error);
        // Optionally, display an error message to the user
        const errorDiv = document.getElementById('panel-node-editor-error');
        if (errorDiv) {
            errorDiv.textContent = "An error occurred while loading the node editor. Please try again.";
            errorDiv.style.display = "block";
        }
    }
}

// Function to get kind enums from the JSON schema
function getKindEnums(jsonData) {
    let kindOptions = [];
    if (jsonData && jsonData.definitions && jsonData.definitions['node-config']) {
        kindOptions = jsonData.definitions['node-config'].properties.kind.enum || [];
    } else {
        throw new Error("Invalid JSON structure or 'kind' enum not found");
    }
    return { kindOptions, schemaData: jsonData };
}

// Function to get type enums based on a kind pattern
function getTypeEnumsByKindPattern(jsonData, pattern) {
    if (jsonData && jsonData.definitions && jsonData.definitions['node-config'] && jsonData.definitions['node-config'].allOf) {
        for (const condition of jsonData.definitions['node-config'].allOf) {
            if (condition.if && condition.if.properties && condition.if.properties.kind && condition.if.properties.kind.pattern === pattern) {
                if (condition.then && condition.then.properties && condition.then.properties.type && condition.then.properties.type.enum) {
                    return condition.then.properties.type.enum;
                }
            }
        }
    }
    return [];
}

let panelNodeEditorKind = "nokia_srlinux"; // Variable to store the selected option for dropdown menu, nokia_srlinux as default
// Function to populate the kind dropdown
function populateKindDropdown(options) {
    // Get the dropdown elements by their IDs
    const dropdownTrigger = document.querySelector("#panel-node-kind-dropdown .dropdown-trigger button span");
    const dropdownContent = document.getElementById("panel-node-kind-dropdown-content");
    const dropdownButton = document.querySelector("#panel-node-kind-dropdown .dropdown-trigger button");
    const dropdownContainer = dropdownButton.closest(".dropdown");

    if (!dropdownTrigger || !dropdownContent || !dropdownButton || !dropdownContainer) {
        console.error("Dropdown elements not found in the DOM.");
        return;
    }

    // Set the initial value on the dropdown button
    dropdownTrigger.textContent = panelNodeEditorKind;

    // Clear any existing content
    dropdownContent.innerHTML = "";

    options.forEach(option => {
        // Create a new anchor element for each option
        const optionElement = document.createElement("a");
        optionElement.classList.add("dropdown-item", "label", "has-text-weight-normal", "is-small", "py-0");
        optionElement.textContent = option;
        optionElement.href = "#"; // Optional, can be adjusted as needed

        // Set an event handler for the option
        optionElement.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent default link behavior

            panelNodeEditorKind = option; // Store the selected option in the variable
            console.log(`${panelNodeEditorKind} selected`); // Log the selected option

            dropdownTrigger.textContent = panelNodeEditorKind;

            // Collapse the dropdown menu
            dropdownContainer.classList.remove("is-active");
        });

        // Append the option element to the dropdown content
        dropdownContent.appendChild(optionElement);
    });
}

// Initialize event listeners for the dropdown
function initializeDropdownListeners() {
    const dropdownButton = document.querySelector("#panel-node-kind-dropdown .dropdown-trigger button");
    const dropdownContainer = dropdownButton.closest(".dropdown");

    if (!dropdownButton || !dropdownContainer) {
        console.error("Dropdown button or container not found in the DOM.");
        return;
    }

    // Toggle dropdown menu on button click
    dropdownButton.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevents the event from bubbling up
        dropdownContainer.classList.toggle("is-active");
    });

    // Collapse the dropdown if clicked outside
    document.addEventListener("click", (event) => {
        if (dropdownContainer.classList.contains("is-active")) {
            dropdownContainer.classList.remove("is-active");
        }
    });
}
// Initialize dropdown listeners once when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    initializeDropdownListeners();
});


let panelNodeEditorTopoViewerRole = "pe"; // Variable to store the selected option for dropdown menu, nokia_srlinux as default
// Function to populate the topoviewerrole dropdown
function populateTopoViewerRoleDropdown(options) {
    // Get the dropdown elements by their IDs
    const dropdownTrigger = document.querySelector("#panel-node-topoviewerrole-dropdown .dropdown-trigger button span");
    const dropdownContent = document.getElementById("panel-node-topoviewerrole-dropdown-content");
    const dropdownButton = document.querySelector("#panel-node-topoviewerrole-dropdown .dropdown-trigger button");
    const dropdownContainer = dropdownButton.closest(".dropdown");

    if (!dropdownTrigger || !dropdownContent || !dropdownButton || !dropdownContainer) {
        console.error("Dropdown elements not found in the DOM.");
        return;
    }

    // Set the initial value on the dropdown button
    dropdownTrigger.textContent = panelNodeEditorTopoViewerRole;


    // Clear any existing content
    dropdownContent.innerHTML = "";

    options.forEach(option => {
        // Create a new anchor element for each option
        const optionElement = document.createElement("a");
        optionElement.classList.add("dropdown-item", "label", "has-text-weight-normal", "is-small", "py-0");
        optionElement.textContent = option;
        optionElement.href = "#"; // Optional, can be adjusted as needed

        // Set an event handler for the option
        optionElement.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent default link behavior

            panelNodeEditorTopoViewerRole = option; // Store the selected option in the variable
            console.log(`${panelNodeEditorTopoViewerRole} selected`); // Log the selected option

            dropdownTrigger.textContent = panelNodeEditorTopoViewerRole;

            // Collapse the dropdown menu
            dropdownContainer.classList.remove("is-active");
        });

        // Append the option element to the dropdown content
        dropdownContent.appendChild(optionElement);
    });
}

// Initialize event listeners for the dropdown
function initializeDropdownTopoViewerRoleListeners() {
    const dropdownButton = document.querySelector("#panel-node-topoviewerrole-dropdown .dropdown-trigger button");
    const dropdownContainer = dropdownButton.closest(".dropdown");

    if (!dropdownButton || !dropdownContainer) {
        console.error("Dropdown button or container not found in the DOM.");
        return;
    }

    // Toggle dropdown menu on button click
    dropdownButton.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevents the event from bubbling up
        dropdownContainer.classList.toggle("is-active");
    });

    // Collapse the dropdown if clicked outside
    document.addEventListener("click", (event) => {
        if (dropdownContainer.classList.contains("is-active")) {
            dropdownContainer.classList.remove("is-active");
        }
    });
}

// Initialize dropdown listeners once when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    initializeDropdownTopoViewerRoleListeners();
});

// Initialize event listener for the close button
document.getElementById("panel-node-editor-close-button").addEventListener("click", () => {
    document.getElementById("panel-node-editor").style.display = "none";
});


// update node data in the editor, save cyto json to file dataCytoMarshall.json and save to clab topo.yaml
async function saveNodeToEditorToFile() {
    const nodeId =document.getElementById("panel-node-editor-id").textContent
    var cyNode = cy.$id(nodeId); // Get cytoscpe node object id

    // get value from panel-node-editor
    nodeName = document.getElementById("panel-node-editor-name").value
    kind = panelNodeEditorKind
    image = document.getElementById("panel-node-editor-image").value
    group = document.getElementById("panel-node-editor-group").value
    topoViewerRole = panelNodeEditorTopoViewerRole

    console.log("panelEditorNodeName", nodeName)
    console.log("panelEditorkind", kind)
    console.log("panelEditorImage", image)
    console.log("panelEditorGroup", group)
    console.log("panelEditorTopoViewerRole",topoViewerRole)

    // save node data to cytoscape node object
    var extraData = {
        "kind": kind,
        "image": image,
        "longname": "",
        "mgmtIpv4Addresss": ""
      };

    cyNode.data(('name'), nodeName)
    cyNode.data(('parent'), group)
    cyNode.data(('topoViewerRole'), topoViewerRole)
    cyNode.data(('extraData'), extraData)

    console.log('cyto node object data: ', cyNode);

    // dump cytoscape node object to nodeData to be persisted to dataCytoMarshall.json
    var nodeData = cy.$id(nodeId).json(); // Get JSON data of the node with the specified ID
    const endpointName = '/clab-save-topo-cyto-json';
  
    try {
      // Send the enhanced node data directly without wrapping it in an object
      const response = await sendRequestToEndpointPost(endpointName, [nodeData]);
      console.log('Node data saved successfully', response);
    } catch (error) {
      console.error('Failed to save node data:', error);
    }

    // add node to clab editor textarea
    clabEditorAddNode(nodeId, nodeName, kind, image, group, topoViewerRole)

    // clabEditorSaveYamlTopo()
}

async function getYamlTopoContent(yamlTopoContent) {

    try {
        // Check if yamlTopoContent is already set
        console.log('YAML Topo Initial Content:', yamlTopoContent);

        if (!yamlTopoContent) {
            // Load the content if yamlTopoContent is empty
            yamlTopoContent = await sendRequestToEndpointGetV3("/get-yaml-topo-content");
        }

        console.log('YAML Topo Content:', yamlTopoContent);
        document.getElementById('panel-clab-editor-text-area').value = yamlTopoContent;

        
    } catch (error) {
        console.error("Error occurred:", error);
        // Handle errors as needed
    }
}
