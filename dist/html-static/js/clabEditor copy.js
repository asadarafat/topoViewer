// Declare global variables at the top
var yamlTopoContent;

// Create a Promise to track when the Monaco Editor is ready
let monacoEditorReady = new Promise((resolve) => {
    // Configure Monaco Editor paths
    require.config({ paths: { 'vs': ' https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs' }});

    require(['vs/editor/editor.main'], function() {
        // Initialize the Monaco Editor
        window.monacoEditor = monaco.editor.create(document.getElementById('panel-clab-editor-text-area'), {
            value: '', // Initial content will be set later
            language: 'yaml', // Set the language mode
            theme: 'vs-dark', // Optional: Set editor theme
            automaticLayout: true // Adjust layout automatically
        });
        resolve(); // Resolve the Promise when the editor is ready
    });
});

// Call getYamlTopoContent on page load
document.addEventListener("DOMContentLoaded", async () => {
    await monacoEditorReady;
    await getYamlTopoContent();
});

// CLAB EDITOR
async function showPanelContainerlabEditor(event) {
    // Wait until the Monaco Editor is initialized
    await monacoEditorReady;

    // Get the YAML content from backend
    await getYamlTopoContent();

    // Get all elements with the class "panel-overlay"
    var panelOverlays = document.getElementsByClassName("panel-overlay");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < panelOverlays.length; i++) {
        panelOverlays[i].style.display = "none";
    }
    document.getElementById("panel-clab-editor").style.display = "block";
}

// Close button event listener
document.getElementById("panel-clab-editor-close-button").addEventListener("click", () => {
    document.getElementById("panel-clab-editor").style.display = "none";
});

// Function to load a file into the editor
function clabEditorLoadFile() {
    const fileInput = document.getElementById('panel-clab-editor-file-input');

    // Trigger the file input's file browser dialog
    fileInput.click();

    // Listen for when the user selects a file
    fileInput.onchange = function() {
        if (fileInput.files.length === 0) {
            return; // No file selected
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async function(event) {
            // Set the content of the Monaco Editor
            window.monacoEditor.setValue(event.target.result);
            yamlTopoContent = event.target.result;

            // Save to the server
            await clabEditorSaveYamlTopo();
        };

        reader.readAsText(file);
    };
}

async function clabEditorAddNode(nodeId, nodeName = "Spine-01", kind ='nokia_srlinux', image = 'ghcr.io/nokia/srlinux:latest', group = 'group-01', topoViewerRole = 'dcgw') {
    await monacoEditorReady;

    if (!kind || !image || !group || !topoViewerRole) {
        console.error("All parameters (kind, image, group, topoViewerRole) must be provided.");
        return;
    }

    // Get the content of the Monaco Editor
    let editorContent = window.monacoEditor.getValue();
    console.log("editorContent - clabEditorAddNode: ", editorContent);  // Debug: log editorContent
    nodeId = (`### ${nodeId}`);

    // Updated regex pattern to capture nodeName if it exists under the specified nodeId
    const existingNodeRegex = new RegExp(`${nodeId}\\s*\\n\\s+(\\S+):`, 'm');

    const match = editorContent.match(existingNodeRegex);
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
    const nodesSectionIndex = editorContent.search(/^\s*nodes:/m);
    const nodeRegex = new RegExp(`\\s*${nodeId}\\s*\\n([\\s\\S]*?)labels:[\\s\\S]*?topoViewer-role:.*`, 'm');

    if (nodesSectionIndex !== -1) {
        const insertionIndex = editorContent.indexOf("  links:", nodesSectionIndex);
        const endOfNodesSection = insertionIndex !== -1 ? insertionIndex : editorContent.length;
        const nodesSection = editorContent.slice(nodesSectionIndex, endOfNodesSection);

        if (nodesSection.match(nodeRegex)) {
            // Replace the existing node
            editorContent = editorContent.replace(nodeRegex, `\n\n${nodeDefinition}`);
        } else {
            // Insert the new node at the end of the nodes section
            editorContent = editorContent.slice(0, endOfNodesSection) + nodeDefinition + editorContent.slice(endOfNodesSection);
        }
    } else {
        // Append if "nodes" section doesn't exist
        editorContent += (editorContent.endsWith("\n") ? "" : "\n") + nodeDefinition;
    }

    // Update the links section if oldNodeName exists
    if (oldNodeName && oldNodeName !== nodeName) {
        // Updated regex to match oldNodeName in any position in the endpoints array
        const linksRegex = new RegExp(`(endpoints:\\s*\\[\\s*".*?)\\b${oldNodeName}\\b(:.*?)\\]`, 'g');
        editorContent = editorContent.replace(linksRegex, `$1${nodeName}$2]`);
    }

    // Update the content of the Monaco Editor
    window.monacoEditor.setValue(editorContent);
    yamlTopoContent = editorContent;

    // Save to the server
    await clabEditorSaveYamlTopo(); // Save the updated content to the server
}

async function clabEditorSaveYamlTopo() {
    // Get the content of the Monaco Editor
    const editorContent = window.monacoEditor.getValue();
    yamlTopoContent = editorContent;
    console.log("clabTopoYamlEditorData - yamlTopoContent: ", yamlTopoContent);

    // Send yamlTopoContent to be persisted on the server
    const endpointName = '/clab-save-topo-yaml';

    try {
        // Send the content directly without wrapping it in an object
        const response = await sendRequestToEndpointPost(endpointName, [yamlTopoContent]);
        console.log('YAML topology saved successfully', response);
    } catch (error) {
        console.error('Failed to save YAML topology:', error);
    }
}

async function clabEditorAddEdge(sourceCyNode, sourceNodeEndpoint, targetCyNode, targetNodeEndpoint) {
    await monacoEditorReady;

    // Get the content of the Monaco Editor
    let editorContent = window.monacoEditor.getValue();

    const sourceNodeName = sourceCyNode.data("name");
    const targetNodeName = targetCyNode.data("name");

    // Edge definition with dynamic endpoints array
    const edgeDefinition = `
    - endpoints: ["${sourceNodeName}:${sourceNodeEndpoint}", "${targetNodeName}:${targetNodeEndpoint}"]`;

    // Locate the 'links' section and insert the edge definition at the end of it
    const linksIndex = editorContent.indexOf("  links:");
    if (linksIndex !== -1) {
        // Find the end of the links section or where the next section begins
        const nextSectionIndex = editorContent.indexOf("\n", linksIndex);
        const insertionIndex = nextSectionIndex !== -1 ? nextSectionIndex : editorContent.length;

        // Insert the edge definition at the end of the links section
        editorContent = editorContent.slice(0, insertionIndex) + edgeDefinition + editorContent.slice(insertionIndex);
    } else {
        // If no 'links' section exists, append the edge definition at the end of the content
        editorContent += "\n  links:" + edgeDefinition;
    }

    // Update the content of the Monaco Editor
    window.monacoEditor.setValue(editorContent);
    yamlTopoContent = editorContent;

    // Save to the server
    await clabEditorSaveYamlTopo();
}

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
            nodeNameInput.value = node.data("id"); // defaulted by node id
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

        // Set the node group in the editor
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
            var topoViwerRoleOptions = ['bridge', 'controller', 'dcgw', 'router', 'leaf', 'pe', 'pon', 'rgw', 'server', 'super-spine', 'spine'];
            populateTopoViewerRoleDropdown(topoViwerRoleOptions);

            // List type enums based on kind pattern
            const typeOptions = getTypeEnumsByKindPattern(jsonData, '(srl|nokia_srlinux)'); // To be added to the UI
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

let panelNodeEditorKind = "nokia_srlinux"; // Variable to store the selected option for dropdown menu
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

let panelNodeEditorTopoViewerRole = "pe"; // Variable to store the selected option for dropdown menu
// Function to populate the topoViewerRole dropdown
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

// Function to save node data from the editor
async function saveNodeToEditorToFile() {
    const nodeId = document.getElementById("panel-node-editor-id").textContent;
    var cyNode = cy.$id(nodeId); // Get Cytoscape node object id

    // Get values from panel-node-editor
    const nodeName = document.getElementById("panel-node-editor-name").value;
    const kind = panelNodeEditorKind;
    const image = document.getElementById("panel-node-editor-image").value;
    const group = document.getElementById("panel-node-editor-group").value;
    const topoViewerRole = panelNodeEditorTopoViewerRole;

    console.log("panelEditorNodeName", nodeName);
    console.log("panelEditorkind", kind);
    console.log("panelEditorImage", image);
    console.log("panelEditorGroup", group);
    console.log("panelEditorTopoViewerRole", topoViewerRole);

    // Save node data to Cytoscape node object
    var extraData = {
        "kind": kind,
        "image": image,
        "longname": "",
        "mgmtIpv4Addresss": ""
    };

    cyNode.data('name', nodeName);
    cyNode.data('parent', group);
    cyNode.data('topoViewerRole', topoViewerRole);
    cyNode.data('extraData', extraData);

    console.log('Cytoscape node object data: ', cyNode);

    // Persist node data to the server
    var nodeData = cyNode.json(); // Get JSON data of the node with the specified ID
    const endpointName = '/clab-save-topo-cyto-json';

    try {
        // Send the enhanced node data directly without wrapping it in an object
        const response = await sendRequestToEndpointPost(endpointName, [nodeData]);
        console.log('Node data saved successfully', response);
    } catch (error) {
        console.error('Failed to save node data:', error);
    }

    // Add node to Monaco Editor
    await clabEditorAddNode(nodeId, nodeName, kind, image, group, topoViewerRole);
}

async function getYamlTopoContent() {
    try {
        // Fetch the content from the server
        yamlTopoContent = await sendRequestToEndpointGetV3("/get-yaml-topo-content");

        console.log('YAML Topo Content:', yamlTopoContent);

        // Set the content of the Monaco Editor
        window.monacoEditor.setValue(yamlTopoContent);
    } catch (error) {
        console.error("Error occurred while fetching YAML topology:", error);
    }
}
