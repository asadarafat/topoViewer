// Initialize a state variable to track the element's presence
// Initialize a state variable to track the element's presence
var isPanel01Cy = false;
var nodeClicked = false;
var edgeClicked = false;

var cy

var globalSelectedNode
var globalSelectedEdge

var globalShellUrl = "/cloudshell"

const labName = 'nokia-ServiceProvider'
const deploymentType = 'colocated'

console.log("Lab-Name: ", labName)
console.log("DeploymentType: ", deploymentType)

document.addEventListener("DOMContentLoaded", function() {
    // Reusable function to initialize a WebSocket connection
    // Reusable function to initialize a WebSocket connection
    function initializeWebSocket(url, onMessageCallback) {
        const protocol = location.protocol === "https:" ? "wss://" : "ws://";
        const socket = new WebSocket(protocol + location.host + url);

        socket.onopen = () => {
            console.log(`Successfully connected WebSocket to ${url}`);
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(`Hi From the WebSocketClient-${url}`);
            }
        };

        socket.onclose = (event) => {
            console.log(`Socket to ${url} closed: `, event);
            socket.send("Client Closed!");
        };

        socket.onerror = (error) => {
            console.log(`Socket to ${url} error: `, error);
        };

        socket.onmessage = onMessageCallback;

        return socket;
    }

    // WebSocket for uptime
    // WebSocket for uptime
    const socketUptime = initializeWebSocket("/uptime", (msgUptime) => {
        const string01 = "Containerlab Topology: " + labName;
        const string02 = " ::: Uptime: " + msgUptime.data;

        const ClabSubtitle = document.getElementById("ClabSubtitle");
        const messageBody = string01 + string02;

        ClabSubtitle.innerText = messageBody;
        console.log(ClabSubtitle.innerText);
    });

    // WebSocket for ContainerNodeStatus
    // WebSocket for ContainerNodeStatus
    const socketContainerNodeStatusInitial = initializeWebSocket(
        "/containerNodeStatus",
        (msgContainerNodeStatus) => {
            try {
                const {
                    Names,
                    Status,
                    State
                } = JSON.parse(msgContainerNodeStatus.data);
                setNodeContainerStatus(Names, Status);
                console.log(JSON.parse(msgContainerNodeStatus.data));

                setNodeDataWithContainerAttribute(Names, Status, State);
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        },
    );

    // // WebSocket for clabServerAddress
    // // WebSocket for clabServerAddress
    // const socketclabServerAddress = initializeWebSocket(
    //     "/clabServerAddress",
    //     (msgclabServerAddress) => {
    //         console.log(msgclabServerAddress.data);
    //         document.title = "TopoViewer ::: " + msgclabServerAddress.data;
    //     },
    // );

    //- Instantiate Cytoscape.js
    //- Instantiate Cytoscape.js
    cy = cytoscape({
        container: document.getElementById("cy"),
        elements: [],
        style: [{
            selector: "node",
            style: {
                "background-color": "#3498db",
                label: "data(label)",
            },
        }, ],
    });




    loadCytoStyle();

    function loadCytoStyle() {
        
        // detect light or dark mode
        const colorScheme =  detectColorScheme();
        console.log('The user prefers:', colorScheme);

        //- Load and apply Cytoscape styles from cy-style.json using fetch
        if (colorScheme == "light") {
            fetch("cy-style.json")
                .then((response) => response.json())
                .then((styles) => {
                    cy.style().fromJson(styles).update();
                })
                .catch((error) => {
                    console.error(
                        "Oops, we hit a snag! Couldnt load the cyto styles, bro.",
                        error,
                    );
                    appendMessage(
                        `Oops, we hit a snag! Couldnt load the cyto styles, bro.: ${error}`,
                    );
                });
        } else if (colorScheme == "dark") {
            fetch("cy-style-dark.json")
                .then((response) => response.json())
                .then((styles) => {
                    cy.style().fromJson(styles).update();
                })
                .catch((error) => {
                    console.error(
                        "Oops, we hit a snag! Couldnt load the cyto styles, bro.",
                        error,
                    );
                    appendMessage(
                        `Oops, we hit a snag! Couldnt load the cyto styles, bro.: ${error}`,
                    );
                });
        }
    }

    // Enable grid guide extension
    cy.gridGuide({
        // On/Off Modules

        snapToGridOnRelease: true,
        snapToGridDuringDrag: false,
        snapToAlignmentLocationOnRelease: true,
        snapToAlignmentLocationDuringDrag: false,
        distributionGuidelines: false,
        geometricGuideline: false,
        initPosAlignment: false,
        centerToEdgeAlignment: false,
        resize: false,
        parentPadding: false,
        drawGrid: false,

        // General
        gridSpacing: 10,
        snapToGridCenter: true,

        // Draw Grid
        zoomDash: true,
        panGrid: true,
        gridStackOrder: -1,
        gridColor: '#dedede',
        lineWidth: 1.0,

        // Guidelines
        guidelinesStackOrder: 4,
        guidelinesTolerance: 2.00,
        guidelinesStyle: {
            strokeStyle: "#8b7d6b",
            geometricGuidelineRange: 400,
            range: 100,
            minDistRange: 10,
            distGuidelineOffset: 10,
            horizontalDistColor: "#ff0000",
            verticalDistColor: "#00ff00",
            initPosAlignmentColor: "#0000ff",
            lineDash: [0, 0],
            horizontalDistLine: [0, 0],
            verticalDistLine: [0, 0],
            initPosAlignmentLine: [0, 0],
        },

        // Parent Padding
        parentSpacing: -1
    });

    // Fetch and load element data from a JSON file
    // fetch("dataCytoMarshall-" + labName + ".json")
    fetch("dataCytoMarshall.json")

        .then((response) => response.json())
        .then((elements) => {
            // Add the elements to the Cytoscape instance
            // Add the elements to the Cytoscape instance
            cy.add(elements);
            //- run layout
            //- run layout
            const layout = cy.layout({
                name: "cola",
                nodeGap: 5,
                edgeLength: 100,
                animate: true,
                randomize: false,
                maxSimulationTime: 1500,
            });
            layout.run();

            // remove node topoviewer
            // remove node topoviewer
            topoViewerNode = cy.filter('node[name = "topoviewer"]');
            topoViewerNode.remove();
        })
        .catch((error) => {
            console.error("Error loading graph data:", error);
        });

    // Instantiate hover text element
    // Instantiate hover text element
    const hoverText = document.createElement("box");
    hoverText.classList.add(
        "hover-text",
        "is-hidden",
        "box",
        "has-text-weight-normal",
        "is-warning",
        "is-smallest",
    );
    hoverText.textContent = "Launch CloudShell.";
    document.body.appendChild(hoverText);

    //- Toggle the Panel(s) when clicking on the cy container
    //- Toggle the Panel(s) when clicking on the cy container
    document.getElementById("cy").addEventListener("click", function(event) {
        //- This code will be executed when you click anywhere in the Cytoscape container
        //- You can add logic specific to the container here
        //- This code will be executed when you click anywhere in the Cytoscape container
        //- You can add logic specific to the container here

        loadCytoStyle();

        if (!nodeClicked && !edgeClicked) {
            if (!isPanel01Cy) {

                // Remove all Overlayed Panel
                // Get all elements with the class "panel-overlay"
                var panelOverlays = document.getElementsByClassName("panel-overlay");
                // Loop through each element and set its display to 'none'
                for (var i = 0; i < panelOverlays.length; i++) {
                    panelOverlays[i].style.display = "none";
                }

                var viewportDrawer = document.getElementsByClassName("viewport-drawer");
                // Loop through each element and set its display to 'none'
                for (var i = 0; i < viewportDrawer.length; i++) {
                    viewportDrawer[i].style.display = "none";
                }

                // display none each ViewPortDrawer Element, the ViewPortDrawer is created during DOM loading and styled as display node initially
                // display none each ViewPortDrawer Element, the ViewPortDrawer is created during DOM loading and styled as display node initially
                var ViewPortDrawerElements =
                    document.getElementsByClassName("ViewPortDrawer");
                var ViewPortDrawerArray = Array.from(ViewPortDrawerElements);
                ViewPortDrawerArray.forEach(function(element) {
                    element.style.display = "none";
                });

            } else {
                removeElementById("Panel-01");
                appendMessage(`"try to remove panel01-Cy"`);
            }
        }
        nodeClicked = false;
        edgeClicked = false;

        appendMessage(`"isPanel01Cy-cy: " ${isPanel01Cy}`);
        appendMessage(`"nodeClicked: " ${nodeClicked}`);
    });

    // Click event listener for nodes
    // Click event listener for nodes
    cy.on("click", "node", function(event) {
        // This code will be executed when you click on a node
        // This code will be executed when you click on a node
        const node = event.target;
        nodeClicked = true;

        if (!node.isParent()) {

            // Remove all Overlayed Panel
            // Get all elements with the class "panel-overlay"
            var panelOverlays = document.getElementsByClassName("panel-overlay");
            // Loop through each element and set its display to 'none'
            for (var i = 0; i < panelOverlays.length; i++) {
                panelOverlays[i].style.display = "none";
            }

            console.log(node)
            console.log(node.data("containerDockerExtraAttribute").status)
            console.log(node.data("extraData"))

            if (document.getElementById("panel-node").style.display === "none") {
                document.getElementById("panel-node").style.display = "block";
            } else {
                document.getElementById("panel-node").style.display = "none";
            }

            document.getElementById("panel-node-name").textContent = node.data("extraData").longname
            document.getElementById("panel-node-status").textContent = node.data("containerDockerExtraAttribute").status
            document.getElementById("panel-node-kind").textContent = node.data("extraData").kind
            document.getElementById("panel-node-image").textContent = node.data("extraData").image
            document.getElementById("panel-node-mgmtipv4").textContent = node.data("extraData").mgmtIpv4Addresss
            document.getElementById("panel-node-mgmtipv6").textContent = node.data("extraData").mgmtIpv6Addresss
            document.getElementById("panel-node-fqdn").textContent = node.data("extraData").fqdn
            document.getElementById("panel-node-group").textContent = node.data("extraData").group
            document.getElementById("panel-node-topoviewerrole").textContent = node.data("topoViewerRole")

            // set selected node-long-name to global variable
            globalSelectedNode = node.data("extraData").longname
            console.log("internal: ", globalSelectedNode)

            appendMessage(`"isPanel01Cy-cy: " ${isPanel01Cy}`);
            appendMessage(`"nodeClicked: " ${nodeClicked}`);
        }
    });

    // Click event listener for edges
    // Click event listener for edges
    cy.on("click", "edge", function(event) {

        // Remove all Overlayed Panel
        // Get all elements with the class "panel-overlay"
        var panelOverlays = document.getElementsByClassName("panel-overlay");
        // Loop through each element and set its display to 'none'
        for (var i = 0; i < panelOverlays.length; i++) {
            panelOverlays[i].style.display = "none";
        }
        
        // This code will be executed when you click on a node
        // You can add logic specific to nodes here
        const clickedEdge = event.target;
        const defaultEdgeColor = "#B1BCC8";
        edgeClicked = true;

        console.log(defaultEdgeColor);

        // Change the color of the clicked edge (for example, to red)
        clickedEdge.style("line-color", "#0043BF");

        // Revert the color of other edges that were not clicked (e.g., back to their default color)
        cy.edges().forEach(function(edge) {
            if (edge !== clickedEdge) {
                edge.style("line-color", defaultEdgeColor);
            }
        });

        document.getElementById("panel-link").style.display = "none";

        if (document.getElementById("panel-link").style.display === "none") {
            document.getElementById("panel-link").style.display = "block";
        } else {
            document.getElementById("panel-link").style.display = "none";
        }

        document.getElementById("panel-link-name").textContent = `${clickedEdge.data("source")} --- ${clickedEdge.data("target")}`

        document.getElementById("panel-link-endpoint-a-name").textContent = `${clickedEdge.data("source")}`
        document.getElementById("panel-link-endpoint-a-mac-address").textContent = `${clickedEdge.data("extraData").clabSourceMacAddress}`
        // setting default impairment endpoint-a values
        document.getElementById("panel-link-endpoint-a-delay").value = `0`
        document.getElementById("panel-link-endpoint-a-jitter").value = `0`
        document.getElementById("panel-link-endpoint-a-rate").value = `0`
        document.getElementById("panel-link-endpoint-a-loss").value = `0`

        document.getElementById("panel-link-endpoint-b-name").textContent = `${clickedEdge.data("target")}`
        document.getElementById("panel-link-endpoint-b-mac-address").textContent = `${clickedEdge.data("extraData").clabTargetMacAddress}`

        // setting default impairment endpoint-b values
        document.getElementById("panel-link-endpoint-b-delay").value = `0`
        document.getElementById("panel-link-endpoint-b-jitter").value = `0`
        document.getElementById("panel-link-endpoint-b-rate").value = `0`
        document.getElementById("panel-link-endpoint-b-loss").value = `0`

        // set selected edge-id to global variable
        globalSelectedEdge = clickedEdge.data("id")


        appendMessage(`"isPanel01Cy-cy: " ${isPanel01Cy}`);
        appendMessage(`"nodeClicked: " ${nodeClicked}`);
    });

    // Instantiate viewport buttons
    // Instantiate viewport buttons
    createViewportButtons(cy);

    function createViewportButtons(cy) {
        // Create a buttons container
        // Create a buttons container
        const boxContainer = document.createElement("div");
        boxContainer.className = "box p-2";
        boxContainer.id = "ViewPortButtons";
        // Set a new box shadow using the style property
        // boxContainer.style.boxShadow = '5px 10px 10px rgba(0, 0, 0, 0.3)';
        // Set a new box shadow using the style property
        // boxContainer.style.boxShadow = '5px 10px 10px rgba(0, 0, 0, 0.3)';

        // Create a button container
        // Create a button container
        const buttonContainer = document.createElement("div");
        buttonContainer.className =
            "is-flex is-flex-direction-column is-justify-content-space-evenly";

        const configContent = [{
                name: "fitToScreen",
                iconClass: "fas fa-expand",
                hoverMessage: "Fit to screen",
                hrefFunction: "eventHandlerLink",
                hrefLink: "",
                callOutFuntionName: "zoomToFitDrawer",
            },
            {
                name: "findNode",
                iconClass: "fas fa-crosshairs",
                hoverMessage: "Find node",
                hrefFunction: "drawer",
                hrefLink: ``,
                drawerConfig: [{
                        idSuffix: "labelFindNode",
                        columnLabelTextContent: "Node Finder",
                        columnLabelClass: "column is-12 pt-2 pb-2 pr-2 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-weight-semibold px-auto",
                        columnInputType: "",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelFindNodeNodeName",
                        columnLabelTextContent: "Node Name",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "",
                        columnInputPlaceholder: "node name",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelFindNodeApply",
                        columnLabelTextContent: "",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "",
                        columnInputType: "button",
                        columnInputClass: "column is-6 p-1 pl-3 is-flex is-justify-content-right",
                        columnInputElementClass: "button is-size-7 is-smallest-element is-link",
                        columnInputContent: "Find",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        columnInputCallOutFuntionName: "nodeFindDrawer",
                        addonsContent: [],
                    },
                ],
            },
            {
                name: "findRoute",
                iconClass: "fas fa-route",
                hoverMessage: "Route Finder",
                hrefFunction: "drawer",
                hrefLink: ``,
                drawerConfig: [{
                        idSuffix: "labelFindRoute",
                        columnLabelTextContent: "Route Finder",
                        columnLabelClass: "column is-12 pt-2 pb-2 pr-2 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-weight-semibold px-auto",
                        columnInputType: "",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelFindRouteSource",
                        columnLabelTextContent: "Source Node",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "",
                        columnInputPlaceholder: "node name",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelFindRouteTarget",
                        columnLabelTextContent: "Target Node",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "",
                        columnInputPlaceholder: "node name",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelFindRouteTargetFind",
                        columnLabelTextContent: "",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "",
                        columnInputType: "button",
                        columnInputClass: "column is-6 p-1 pl-3 is-flex is-justify-content-right",
                        columnInputElementClass: "button is-size-7 is-smallest-element is-link",
                        columnInputContent: "Find",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        columnInputCallOutFuntionName: "pathFinderDijkstraDrawer",
                        addonsContent: [],
                    },
                ],
            },
            {
                name: "adjustLayout",
                iconClass: "fas fa-solid fa-circle-nodes",
                hoverMessage: "Adjust Layout",
                hrefFunction: "drawer",
                hrefLink: ``,
                drawerConfig: [{
                        idSuffix: "labelAdjustLayoutForceDirected",
                        columnLabelTextContent: "Force-Directed Layout",
                        columnLabelClass: "column is-12 pt-2 pb-2 pr-2 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-weight-semibold px-auto",
                        columnInputType: "",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutLinksLenghtSlider",
                        columnLabelTextContent: "Link Length",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto",
                        columnInputType: "slider",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutNodeGapSlider",
                        columnLabelTextContent: "Node Gap",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto",
                        columnInputType: "slider",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentVertical",
                        columnLabelTextContent: "Vertical Alignment Layout",
                        columnLabelClass: "column is-12 pt-2 pb-2 pr-2 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-weight-semibold px-auto",
                        columnInputType: "",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentVerticalNodeGap",
                        columnLabelTextContent: "Node Gap",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "5",
                        columnInputPlaceholder: "node spacing",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentVerticalGroupGap",
                        columnLabelTextContent: "Group Gap",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "50",
                        columnInputPlaceholder: "group spacing",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentVerticalApply",
                        columnLabelTextContent: "",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "",
                        columnInputType: "button",
                        columnInputClass: "column is-6 p-1 pl-3 is-flex is-justify-content-right",
                        columnInputElementClass: "button is-size-7 is-smallest-element is-link",
                        columnInputContent: "Apply",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        columnInputCallOutFuntionName: "verticallAllignLayout",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentHorizontal",
                        columnLabelTextContent: "Horizontal Alignment Layout",
                        columnLabelClass: "column is-12 pt-2 pb-2 pr-2 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-weight-semibold px-auto",
                        columnInputType: "",
                        columnInputContent: "",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentHorizontalNodeGap",
                        columnLabelTextContent: "Node Gap",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "5",
                        columnInputPlaceholder: "node spacing",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentHorizontalGroupGap",
                        columnLabelTextContent: "Group Gap",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "label is-size-7 has-text-right has-text-weight-normal px-auto pt-1",
                        columnInputType: "input",
                        columnInputClass: "column is-6 p-1 pl-3",
                        columnInputElementClass: "input is-size-7 has-text-left has-text-weight-normal is-smallest-element",
                        columnInputContent: "50",
                        columnInputPlaceholder: "group spacing",
                        columnInputAttribute: "enabled",
                        addonsContent: [],
                    },
                    {
                        idSuffix: "labelAdjustLayoutAlignmentHorizontalApply",
                        columnLabelTextContent: "",
                        columnLabelClass: "column is-6 pt-0 pr-1 LinksLenghtSlider",
                        columnLabelElementClass: "",
                        columnInputType: "button",
                        columnInputClass: "column is-6 p-1 pl-3 is-flex is-justify-content-right",
                        columnInputElementClass: "button is-size-7 is-smallest-element is-link",
                        columnInputContent: "Apply",
                        columnInputPlaceholder: "",
                        columnInputAttribute: "enabled",
                        columnInputCallOutFuntionName: "horizontalAllignLayout",
                        addonsContent: [],
                    },
                ],
            },
            {
                name: "togleEndpointLabel",
                iconClass: "fas fa-tag",
                hoverMessage: "Toggle endpoint label",
                hrefFunction: "eventHandlerLink",
                hrefLink: "",
                callOutFuntionName: "toggleLinkEndpoint",
            },
            {
                name: "togleContainerStatus",
                iconClass: "fab fa-docker",
                hoverMessage: "Toggle container status",
                hrefFunction: "eventHandlerLink",
                hrefLink: "",
                callOutFuntionName: "toggleContainerStatusVisibility",
            },
            {
                name: "captureViewport",
                idSuffix: "modalSaveViewport",
                iconClass: "fas fa-camera",
                hoverMessage: "Capture Viewport",
                hrefFunction: "eventHandlerLink",
                hrefLink: "",
                callOutFuntionName: "showModalCaptureViewport",
                callOutFuntionArgsString: "modalSaveViewport",
                callOutFuntionArgsObject: "",
            },
        ];

        const controlId = "viewportButtons";

        configContent.forEach((config) => {
            const control = document.createElement("p");

            control.id = `${controlId}-button${config.name}`;
            control.className = "control p-0";

            const button = document.createElement("a");
            button.id = `${controlId}-button${config.name}`;
            // button.className = `button is-large is-outlined py-4 is-${addon.name === 'blue' ? 'link' : 'success'}`;
            // button.className = `button is-large is-outlined py-4 is-${addon.name === 'blue' ? 'link' : 'success'}`;
            button.className = `button px-4 py-4 is-smallest-element`;
            button.style.outline = "none";

            if (config.hrefFunction == "eventHandlerLink") {
                button.addEventListener("click", function(cy) {
                    if (config.callOutFuntionArgsString != "") {
                        eval(
                            config.callOutFuntionName + `('${config.callOutFuntionArgsString}')`,
                        );
                    } else if (config.callOutFuntionArgsObject != "") {
                        eval(config.callOutFuntionName + `(${config.callOutFuntionArgsObject})`);
                    } else {
                        // Use eval() to call the function by name
                        // Use eval() to call the function by name
                        eval(config.callOutFuntionName + `(cy)`);
                    }
                });
            }

            if (config.hrefFunction == "drawer") {
                // button.addEventListener('click', () => {
                // Create an drawerBox element
                // button.addEventListener('click', () => {
                // Create an drawerBox element
                const drawerBox = document.createElement("div");
                drawerBox.className = "box drawerBox ViewPortDrawer p-1 is-1";
                drawerBox.style.display = "none";

                window.addEventListener("load", (event) => {
                    // Access the height of buttonContainer here
                    // Access the height of buttonContainer here
                    const rect = boxContainer.getBoundingClientRect();
                    const calculatedHeight = rect.height;
                    // drawerBox.style.height = `${calculatedHeight}px`;
                    // drawerBox.style.height = `${calculatedHeight}px`;
                    drawerBox.style.height = "auto";

                    drawerBox.style.display = "block";

                    const contentHeight = drawerBox.getBoundingClientRect().height;

                    if (contentHeight > calculatedHeight) {
                        drawerBox.style.height = "auto";
                    } else {
                        drawerBox.style.height = `${calculatedHeight}px`;
                    }
                    drawerBox.style.display = "none";
                });

                //// The drawerBox element is created using createPanelBlockContainer() and createPanelBlockForm() functions
                // Panel Block 01
                //// The drawerBox element is created using createPanelBlockContainer() and createPanelBlockForm() functions
                // Panel Block 01
                panelBlockContainer = createPanelBlockContainer(`${button.id}`);
                panelBlock01 = panelBlockContainer.panelBlock;
                divPanelBlock01 = panelBlockContainer.divPanelBlock;

                createPanelBlockForm(
                    config.drawerConfig,
                    panelBlock01,
                    divPanelBlock01,
                    cy,
                );
                // Per panelBlock divPanelBlock01 --> panelBlock01
                // Per panelBlock divPanelBlock01 --> panelBlock01
                panelBlock01.appendChild(divPanelBlock01);
                drawerBox.appendChild(panelBlock01);

                // Add click event listener to the button
                // Add click event listener to the button
                button.addEventListener("click", () => {
                    // Toggle the display of the corresponding drawerBox
                    // Toggle the display of the corresponding drawerBox
                    if (drawerBox.style.display === "none" || drawerBox.style.display === "") {
                        // Hide all other drawerBoxes
                        // Hide all other drawerBoxes
                        const allAnimatedBoxes = document.querySelectorAll(".ViewPortDrawer");
                        allAnimatedBoxes.forEach((box) => {
                            if (box !== drawerBox) {
                                box.style.display = "none";
                            }
                        });
                        // Show the corresponding drawerBox
                        // Show the corresponding drawerBox
                        drawerBox.style.display = "block";
                    } else {
                        // Hide the corresponding drawerBox when clicked again
                        // Hide the corresponding drawerBox when clicked again
                        drawerBox.style.display = "none";
                    }
                });

                // Append the container to the document body
                // Append the container to the document body
                document.body.appendChild(drawerBox);
            }

            // Create a icon element
            // Create a icon element
            const icon = document.createElement("span");
            icon.className = "icon is-small";
            const iconElement = document.createElement("i");
            iconElement.className = config.iconClass;
            icon.appendChild(iconElement);

            button.appendChild(icon);
            control.appendChild(button);

            // Create a hover text paragraph element
            // Create a hover text paragraph element
            const hoverText = document.querySelector(".hover-text");

            // Add event listeners for hover behavior
            // Add event listeners for hover behavior
            button.addEventListener("mouseover", () => {
                // Calculate the position for the hover text
                // Calculate the position for the hover text
                const rect = button.getBoundingClientRect();
                const top = rect.top - hoverText.offsetHeight + 20;
                const left = rect.left + 35;
                // Set the position and show the hover text
                // Set the position and show the hover text
                hoverText.style.top = `${top}px`;
                hoverText.style.left = `${left}px`;
                hoverText.classList.remove("is-hidden");
                hoverText.textContent = config.hoverMessage;
            });

            button.addEventListener("mouseout", () => {
                // Hide the hover text
                // Hide the hover text
                hoverText.classList.add("is-hidden");
            });

            // Append the button to the container
            // Append the button to the container
            buttonContainer.appendChild(control);
            boxContainer.appendChild(buttonContainer);
        });

        // Append the container to the document body
        // Append the container to the document body
        document.body.appendChild(boxContainer);
    }

    // Initiate Layout SLider
    // Initiate Layout SLider
    setupLayoutSliders(cy);

    function setupLayoutSliders(cy) {
        const updateLayout = (edgeLengthValue, nodeGapValue) => {
            console.log("edgeLengthValue", edgeLengthValue);
            console.log("nodeGapValue", nodeGapValue);

            cy
                .layout({
                    fit: true,
                    name: "cola",
                    animate: true,
                    randomize: false,
                    maxSimulationTime: 400,
                    //edgeLength: '50',
                    // nodeGap: function(node){
                    // 	 return 10;
                    // 	},
                    //edgeLength: '50',
                    // nodeGap: function(node){
                    // 	 return 10;
                    // 	},
                    edgeLength: function(e) {
                        return edgeLengthValue / e.data("weight");
                    },
                    nodeGap: function(e) {
                        return nodeGapValue / e.data("weight");
                    },
                })
                .run();
        };

        const edgeLengthSlider = document.getElementById(
            "panelBlock-viewportButtons-buttonadjustLayout-divPanelBlock-columnContainerlabelAdjustLayoutLinksLenghtSlider-panelContentlabelAdjustLayoutLinksLenghtSlider-columnsPanelContentlabelAdjustLayoutLinksLenghtSlider-labelColumnlabelAdjustLayoutLinksLenghtSlider-inputColumnlabelAdjustLayoutLinksLenghtSlider-labellabelAdjustLayoutLinksLenghtSlider",
        );
        const nodeGapSlider = document.getElementById(
            "panelBlock-viewportButtons-buttonadjustLayout-divPanelBlock-columnContainerlabelAdjustLayoutNodeGapSlider-panelContentlabelAdjustLayoutNodeGapSlider-columnsPanelContentlabelAdjustLayoutNodeGapSlider-labelColumnlabelAdjustLayoutNodeGapSlider-inputColumnlabelAdjustLayoutNodeGapSlider-labellabelAdjustLayoutNodeGapSlider",
        );

        const sliderEventHandler = () => {
            console.log("edgeLengthSlider.value", edgeLengthSlider.value);
            console.log("nodeGapSlider.value", nodeGapSlider.value);

            const edgeLengthValue = parseFloat(edgeLengthSlider.value);
            const nodeGapValue = parseFloat(nodeGapSlider.value);
            updateLayout(edgeLengthValue, nodeGapValue);
        };

        edgeLengthSlider.addEventListener("input", sliderEventHandler);
        nodeGapSlider.addEventListener("input", sliderEventHandler);
    }

    function generateNodesEvent(event) {
        // Your event handling logic here
        //- Add a click event listener to the 'Generate' button
        //- Get the number of node from the input field
        // Your event handling logic here
        //- Add a click event listener to the 'Generate' button
        //- Get the number of node from the input field
        console.log("generateNodesButton clicked");
        const numNodes = document.getElementById("generateNodesInput").value;
        console.log(numNodes);
        //- Check if the number of node is empty
        //- Check if the number of node is empty
        if (numNodes === null) {
            //- if node number empty do nothing
            //- if node number empty do nothing
            return;
        }
        const numNodesToGenerate = parseInt(numNodes, 10);
        //- Check if the number of node is positive
        //- Check if the number of node is positive
        if (isNaN(numNodesToGenerate) || numNodesToGenerate <= 0) {
            //- Invalid input
            //- Invalid input
            appendMessage(
                "Error:" + "Bro, you gotta enter a valid positive number, come on!",
            );
            return;
        }
        //- Generate nodes with random positions
        //- Generate nodes with random positions
        for (let i = 0; i < numNodesToGenerate; i++) {
            const nodeName = `node-${i + 1}`;
            const newNode = {
                group: "nodes",
                data: {
                    id: nodeName,
                    name: nodeName,
                },
                position: {
                    x: Math.random() * 400,
                    y: Math.random() * 400,
                },
            };
            //-cy.add(newNode);
            //-cy.add(newNode);
            try {
                cy.add(newNode);
                //- throw new Error('This is an example exception');
                //- throw new Error('This is an example exception');
            } catch (error) {
                //- Log the exception to the console
                //- Log the exception to the console
                console.error("An exception occurred:", error);
                //- Log the exception to notification message to the textarea
                //- Log the exception to notification message to the textarea
                appendMessage("An exception occurred:" + error);
            }
        }
        //- Generate random edges between nodes
        //- Generate random edges between nodes
        for (let i = 0; i < numNodesToGenerate; i++) {
            const sourceNode = `node-${i + 1}`;
            const targetNode = `node-${Math.floor(Math.random() * numNodesToGenerate) + 1}`;
            if (sourceNode !== targetNode) {
                const newEdge = {
                    group: "edges",
                    data: {
                        id: "from-" + sourceNode + "-to-" + targetNode,
                        name: "from-" + sourceNode + "-to-" + targetNode,
                        source: sourceNode,
                        target: targetNode,
                    },
                };
                try {
                    cy.add(newEdge);
                    //- throw new Error('This is an example exception');
                    //- throw new Error('This is an example exception');
                } catch (error) {
                    //- Log the exception to the console
                    //- Log the exception to the console
                    console.error("An exception occurred:", error);
                    //- Log the exception to notification message to the textarea
                    //- Log the exception to notification message to the textarea
                    appendMessage("An exception occurred::" + error);
                }
            }
        }
        //- run layout
        //- run layout
        const layout = cy.layout({
            name: "cola",
            nodeGap: 5,
            edgeLengthVal: 45,
            animate: true,
            randomize: false,
            maxSimulationTime: 1500,
        });
        layout.run();
        //-//- Append a notification message to the textarea
        //-//- Append a notification message to the textarea
        console.log(
            "Info: " +
            `Boom! Just generated ${numNodesToGenerate} nodes with some random edges. That's how we roll!`,
        );
        appendMessage(
            "Info: " +
            `Boom! Just generated ${numNodesToGenerate} nodes with some random edges. That's how we roll!`,
        );
    }

    function spawnNodeEvent(event) {
        //- Add a click event listener to the 'Submit' button in the hidden form
        //- Get the node name from the input field
        //- Add a click event listener to the 'Submit' button in the hidden form
        //- Get the node name from the input field
        const nodeName = document.getElementById("nodeName").value;
        console.log(nodeName);
        //- Check if a node name is empty
        //- Check if a node name is empty
        if (nodeName == "") {
            //- append message in textArea
            //- append message in textArea
            appendMessage("Error: Enter node name.");
            return;
        }
        //- Check if a node with the same name already exists
        //- Check if a node with the same name already exists
        if (cy.$(`node[id = "${nodeName}"]`).length > 0) {
            //- append message in textArea
            //- append message in textArea
            appendMessage("Error: Node with this name already exists.");
            return;
        }
        //- Create a new node element
        //- Create a new node element
        const newNode = {
            group: "nodes",
            data: {
                id: nodeName,
                name: nodeName,
                label: nodeName,
            },
        };
        //- Add the new node to Cytoscape.js
        //- Add the new node to Cytoscape.js
        cy.add(newNode);
        //- Randomize the positions and center the graph
        //- Randomize the positions and center the graph
        const layout = cy.layout({
            name: "cola",
            nodeGap: 5,
            edgeLengthVal: 45,
            animate: true,
            randomize: false,
            maxSimulationTime: 1500,
        });
        layout.run();
        //- Append a notification message to the textarea
        //- Append a notification message to the textarea
        console.log("Info: " + `Nice! Node "${nodeName}" added successfully.`);
        appendMessage("Info: " + `Nice! Node "${nodeName}" added successfully.`);
    }

    function nodeFindEvent(event) {
        //- Get a reference to your Cytoscape instance (assuming it's named 'cy')
        //- const cy = window.cy; //- Replace 'window.cy' with your actual Cytoscape instance
        //- Find the node with the specified name
        //- Get a reference to your Cytoscape instance (assuming it's named 'cy')
        //- const cy = window.cy; //- Replace 'window.cy' with your actual Cytoscape instance
        //- Find the node with the specified name
        const nodeName = document.getElementById("nodeFindInput").value;
        const node = cy.$(`node[name = "${nodeName}"]`);
        //- Check if the node exists
        //- Check if the node exists
        if (node.length > 0) {
            // console
            // console
            console.log("Info: " + 'Sweet! Node "' + nodeName + '" is in the house.');
            appendMessage("Info: " + 'Sweet! Node "' + nodeName + '" is in the house.');
            //- Apply a highlight style to the node
            //- Apply a highlight style to the node
            node.style({
                "border-color": "red",
                "border-width": "2px",
                "background-color": "yellow",
            });
            //- Zoom out on the node
            //- Zoom out on the node
            cy.fit();
            //- Zoom in on the node
            //- Zoom in on the node
            cy.animate({
                zoom: {
                    level: 5,
                    position: {
                        x: node.position("x"),
                        y: node.position("y"),
                    },
                    renderedPosition: {
                        x: node.renderedPosition("x"),
                        y: node.renderedPosition("y"),
                    },
                },
                duration: 1500,
            });
        } else {
            console.error(
                `Bro, I couldn't find a node named "${nodeName}". Try another one.`,
            );
            appendMessage(
                `Bro, I couldn't find a node named "${nodeName}". Try another one.`,
            );
        }
    }

    function zoomToFitDrawer() {
        const initialZoom = cy.zoom();
        appendMessage(`Bro, initial zoom level is "${initialZoom}".`);
        //- Fit all nodes possible with padding
        //- Fit all nodes possible with padding
        cy.fit();
        const currentZoom = cy.zoom();
        appendMessage(`And now the zoom level is "${currentZoom}".`);
    }

    function pathFinderDijkstraEvent(event) {
        // Usage example:
        // highlightShortestPath('node-a', 'node-b'); // Replace with your source and target node IDs
        //- Function to get the default node style from cy-style.json
        //- weight: (edge) => 1, // You can adjust the weight function if needed
        //- weight: (edge) => edge.data('distance')
        // Usage example:
        // highlightShortestPath('node-a', 'node-b'); // Replace with your source and target node IDs
        //- Function to get the default node style from cy-style.json
        //- weight: (edge) => 1, // You can adjust the weight function if needed
        //- weight: (edge) => edge.data('distance')

        console.log("im triggered");

        // Remove existing highlight from all edges
        // Remove existing highlight from all edges
        cy.edges().forEach((edge) => {
            edge.removeClass("spf");
        });

        // Get the node sourceNodeId from pathFinderSourceNodeInput and targetNodeId from pathFinderTargetNodeInput
        // Get the node sourceNodeId from pathFinderSourceNodeInput and targetNodeId from pathFinderTargetNodeInput
        const sourceNodeId = document.getElementById(
            "pathFinderSourceNodeInput",
        ).value;
        const targetNodeId = document.getElementById(
            "pathFinderTargetNodeInput",
        ).value;

        // Assuming you have 'cy' as your Cytoscape instance
        // Assuming you have 'cy' as your Cytoscape instance
        const sourceNode = cy.$(`node[id="${sourceNodeId}"]`);
        const targetNode = cy.$(`node[id="${targetNodeId}"]`);

        console.log(
            "Info: " +
            "Let's find the path from-" +
            sourceNodeId +
            "-to-" +
            targetNodeId +
            "!",
        );
        appendMessage(
            "Info: " +
            "Let's find the path from-" +
            sourceNodeId +
            "-to-" +
            targetNodeId +
            "!",
        );

        // Check if both nodes exist
        // Check if both nodes exist
        if (sourceNode.length === 0 || targetNode.length === 0) {
            console.error(
                `Bro, couldn't find the source or target node you specified. Double-check the node names.`,
            );
            appendMessage(
                `Bro, couldn't find the source or target node you specified. Double-check the node names.`,
            );
            return;
        }

        // Get the Dijkstra result with the shortest path
        // Get the Dijkstra result with the shortest path
        const dijkstraResult = cy.elements().dijkstra({
            root: sourceNode,
            weight: (edge) => 1,
            // Use the custom weight attribute
            // weight: edge => edge.data('customWeight'),
            // Use the custom weight attribute
            // weight: edge => edge.data('customWeight'),
        });
        // Get the shortest path from Dijkstra result
        // Get the shortest path from Dijkstra result
        const shortestPathEdges = dijkstraResult.pathTo(targetNode);
        console.log(shortestPathEdges);

        // Check if there is a valid path (shortestPathEdges is not empty)
        // Check if there is a valid path (shortestPathEdges is not empty)
        if (shortestPathEdges.length > 1) {
            //// Apply a style to highlight the shortest path edges
            // shortestPathEdges.style({
            //	'line-color': 'red',
            //	'line-style': 'solid',
            // });
            //// Apply a style to highlight the shortest path edges
            // shortestPathEdges.style({
            //	'line-color': 'red',
            //	'line-style': 'solid',
            // });

            // Highlight the shortest path
            // Highlight the shortest path
            shortestPathEdges.forEach((edge) => {
                edge.addClass("spf");
            });

            //- Zoom out on the node
            //- Zoom out on the node
            cy.fit();

            //- Zoom in on the node
            //- Zoom in on the node
            cy.animate({
                zoom: {
                    level: 5,
                    position: {
                        x: sourceNode.position("x"),
                        y: sourceNode.position("y"),
                    },
                    renderedPosition: {
                        x: sourceNode.renderedPosition("x"),
                        y: sourceNode.renderedPosition("y"),
                    },
                },
                duration: 1500,
            });
            // throw log
            // throw log
            console.log(
                "Info: " +
                "Yo, check it out! Shorthest Path from-" +
                sourceNodeId +
                "-to-" +
                targetNodeId +
                " has been found.",
            );
            appendMessage(
                "Info: " +
                "Yo, check it out! Shorthest Path from-" +
                sourceNodeId +
                "-to-" +
                targetNodeId +
                " has been found, below is the path trace..",
            );
            console.log(shortestPathEdges);

            shortestPathEdges.forEach((edge) => {
                console.log("Edge ID:", edge.id());
                console.log("Source Node ID:", edge.source().id());
                console.log("Target Node ID:", edge.target().id());

                edgeId = edge.id();
                sourceNodeId = edge.source().id();
                targetNodeId = edge.target().id();
                // You can access other properties of the edge, e.g., source, target, data, etc.
                // You can access other properties of the edge, e.g., source, target, data, etc.

                appendMessage("Info: " + "Edge ID: " + edgeId);
                appendMessage("Info: " + "Source Node ID: " + sourceNodeId);
                appendMessage("Info: " + "Target Node ID: " + targetNodeId);
            });
        } else {
            console.error(
                `Bro, there is no path from "${sourceNodeId}" to "${targetNodeId}".`,
            );
            appendMessage(
                `Bro, there is no path from "${sourceNodeId}" to "${targetNodeId}".`,
            );
            return;
        }
    }

    function closePanel01Event(event) {
        var panel = document.getElementById("Panel-01");
        if (panel.style.display === "none" || panel.style.display === "") {
            //- Show the panel
            //- Show the panel
            panel.style.display = "block";
            panel.classList.toggle("active");
        } else {
            //- Hide the panel
            //- Hide the panel
            panel.style.display = "none";
        }
        isPanel01Added = false;
        console.log(
            "Panel-01.style: " + document.getElementById("Panel-01").style.display,
        );
    }

    var linkEndpointVisibility = true;

    function toggleLinkEndpoint() {
        if (linkEndpointVisibility) {
            cy.edges().forEach(function(edge) {
                edge.style("source-label", ".");
                edge.style("target-label", ".");
                linkEndpointVisibility = false;
            });
        } else {
            cy.edges().forEach(function(edge) {
                edge.style("source-label", edge.data("sourceEndpoint"));
                edge.style("target-label", edge.data("targetEndpoint"));
                linkEndpointVisibility = true;
            });
        }
    }

    var nodeContainerStatusVisibility = false;

    function toggleContainerStatusVisibility() {
        if (nodeContainerStatusVisibility) {
            nodeContainerStatusVisibility = false;
            console.log(
                "nodeContainerStatusVisibility: " + nodeContainerStatusVisibility,
            );
            appendMessage(
                "nodeContainerStatusVisibility: " + nodeContainerStatusVisibility,
            );
            bulmaToast.toast({
                message: `Alright, mission control, we're standing down. 🛑🔍 Container status probing aborted. Stay chill, folks. 😎👨‍💻`,
                type: "is-warning is-size-6 p-3",
                duration: 4000,
                position: "top-center",
                closeOnClick: true,
            });
        } else {
            nodeContainerStatusVisibility = true;
            console.log(
                "nodeContainerStatusVisibility: " + nodeContainerStatusVisibility,
            );
            appendMessage(
                "nodeContainerStatusVisibility: " + nodeContainerStatusVisibility,
            );
            bulmaToast.toast({
                message: `🕵️‍♂️ Bro, we're currently on a mission to probe that container status! Stay tuned for the results. 🔍🚀👨‍💻`,
                type: "is-warning is-size-6 p-3",
                duration: 4000,
                position: "top-center",
                closeOnClick: true,
            });
        }
    }

    function setNodeContainerStatus(containerNodeName, containerNodeStatus) {
        cy.nodes().forEach(function(node) {
            var nodeId = node.data("id");

            // Find the corresponding status nodes based on node ID
            // Find the corresponding status nodes based on node ID
            var statusGreenNode = cy.$(`node[name="${nodeId}-statusGreen"]`);
            var statusOrangeNode = cy.$(`node[name="${nodeId}-statusOrange"]`);
            var statusRedNode = cy.$(`node[name="${nodeId}-statusRed"]`);

            if (statusGreenNode.length === 0 || statusRedNode.length === 0) {
                // If status nodes are not found, skip this node
                // If status nodes are not found, skip this node
                return;
            }

            // Update positions of status nodes relative to the node
            // Update positions of status nodes relative to the node
            var nodePosition = node.position();
            var offset = {
                x: -4,
                y: -10
            };
            var statusGreenNodePosition = {
                x: nodePosition.x + offset.x,
                y: nodePosition.y + offset.y,
            };
            var statusRedNodePosition = {
                x: nodePosition.x + offset.x,
                y: nodePosition.y + offset.y,
            };

            // Check if the nodeContainerStatusVisibility is true
            // Check if the nodeContainerStatusVisibility is true
            if (nodeContainerStatusVisibility) {
                // Check if the containerNodeName includes nodeId and containerNodeStatus includes 'healthy'
                // Check if the containerNodeName includes nodeId and containerNodeStatus includes 'healthy'
                if (
                    containerNodeName.includes(nodeId) &&
                    (containerNodeStatus.includes("Up") ||
                        containerNodeStatus.includes("healthy"))
                ) {
                    statusGreenNode.show();
                    statusRedNode.hide();
                    console.log(
                        "nodeContainerStatusVisibility: " + nodeContainerStatusVisibility,
                    );
                } else if (
                    containerNodeName.includes(nodeId) &&
                    containerNodeStatus.includes("(health: starting)")
                ) {
                    statusGreenNode.hide();
                    statusOrangeNode.show();
                } else if (
                    containerNodeName.includes(nodeId) &&
                    containerNodeStatus.includes("Exited")
                ) {
                    statusGreenNode.hide();
                    statusRedNode.show();
                }
            } else {
                statusGreenNode.hide();
                statusRedNode.hide();
            }

            statusGreenNode.position(statusGreenNodePosition);
            statusRedNode.position(statusRedNodePosition);
        });
    }

    function setNodeDataWithContainerAttribute(containerNodeName, status, state) {
        cy.nodes().forEach(function(node) {
            var nodeId = node.data("id");
            if (containerNodeName.includes(nodeId)) {
                var containerDockerExtraAttributeData = {
                    state: state,
                    status: status,
                };

                node.data(
                    "containerDockerExtraAttribute",
                    containerDockerExtraAttributeData,
                );
            }
        });
    }

    // 
    // End of JS Functions Event Handling section
    // End of JS Functions Event Handling section
    // 

    // 
    // Start of JS Generic Functions
    // Start of JS Generic Functions
    // 
    // 
    // Start of JS Generic Functions
    // Start of JS Generic Functions
    // 


    //- Function to get the default node style from cy-style.json
    //- Function to get the default node style from cy-style.json
    async function getDefaultNodeStyle(node) {
        try {
            //- Fetch the cy-style.json file
            //- Fetch the cy-style.json file
            const response = await fetch("cy-style.json");
            //- Check if the response is successful (status code 200)
            //- Check if the response is successful (status code 200)
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch cy-style.json (${response.status} ${response.statusText})`,
                );
            }
            //- Parse the JSON response
            //- Parse the JSON response
            const styleData = await response.json();
            //- Extract the default node style from the loaded JSON
            //- Adjust this based on your JSON structure
            //- Extract the default node style from the loaded JSON
            //- Adjust this based on your JSON structure
            const defaultNodeStyle = styleData[0].style;
            return defaultNodeStyle;
        } catch (error) {
            console.error("Error loading cy-style.json:", error);
            appendMessage(`Error loading cy-style.json: ${error}`);
            //- Return a default style in case of an error
            //- Return a default style in case of an error
            return {
                "background-color": "blue",
                "border-color": "gray",
                "border-width": "1px",
            };
        }
    }

    ///-logMessagesPanel Function to add a click event listener to the copy button
    ///-logMessagesPanel Function to add a click event listener to the copy button
    const copyButton = document.getElementById("copyToClipboardButton");
    copyButton.className = "button is-smallest-element";
    copyButton.addEventListener("click", copyToClipboard);

    /// logMessagesPanel Function to copy textarea content to clipboard
    /// logMessagesPanel Function to copy textarea content to clipboard
    function copyToClipboard() {
        const textarea = document.getElementById("notificationTextarea");
        textarea.select();
        document.execCommand("copy");
    }



    // function closePanelEvent(event, panel) {
    //     panel.style.display = "block";
    //     console.log(panel.style.display);
    //     panel.style.display = "none";
    // }

    function createModal(modalId, modalContent) {
        // Create the modal
        // Create the modal
        const htmlContent = `
                                                        <div id="${modalId}" class="modal">
                                                            <div id="${modalId}-modalBackgroundId" class="modal-background"></div>
                                                                ${modalContent}
                                                        </div>
                                                        `;

        const modalDiv = document.createElement("div");
        modalDiv.innerHTML = htmlContent;
        modalDiv.id = "modalDivExportViewport";

        document.body.appendChild(modalDiv);
        const modalBackground = document.getElementById(
            `${modalId}-modalBackgroundId`,
        );

        modalBackground.addEventListener("click", function() {
            const modal = modalBackground.parentNode;
            modal.classList.remove("is-active");
        });
    }

    function showModalCaptureViewport(modalId) {
        const modalContentSaveViewport = ` 	
                                                                <div class="modal-content" style="max-width:300px;">
                                                                    <div class="box px-1 pb-1">
                                                                        <div class="column is-flex is-justify-content-center ">
                                                                                <i class="icon fas fa-camera  is-large"></i>
                                                                        </div>
                                                                        <div class="column">
                                                                            <div class="content py-0 px-5">
                                                                                <p class="has-text-centered is-size-6 has-text-weight-bold py-0 mb-2">Select file type</p>
                                                                                <p class="has-text-centered is-size-7 has-text-weight-normal">Choose one or multiple types you want to export</p>
                                                                            </div>
                                                                        </div>
                                                                        <div class="column px-5">
                                                                            <div class="control is-flex is-flex-direction-column">
                                                                                <div class="column py-2">
                                                                                    <label class="checkbox is-size-7">
                                                                                    <input type="checkbox"  name="checkboxSaveViewPort" value="option01">
                                                                                    PNG
                                                                                    </label>
                                                                                </div>
                                                                                <div class="column py-2">
                                                                                    <label class="checkbox is-size-7">
                                                                                    <input type="checkbox" name="checkboxSaveViewPort" value="option02">
                                                                                    Draw.IO
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="column p-0 pb-3 is-flex is-flex-direction-column is-flex-grow-3" >
                                                                            <div class="column" style="background-color: white">
                                                                                <button id="performActionButton" class="button button-modal is-small is-link is-fullwidth">Continue</button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                `;

        // Instantiate modal
        // Instantiate modal
        createModal("modalSaveViewport", modalContentSaveViewport);

        // create event listener
        // create event listener
        const performActionButton = document.getElementById("performActionButton");
        performActionButton.addEventListener("click", function() {
            const checkboxName = "checkboxSaveViewPort";
            const checkboxes = document.querySelectorAll(
                `input[type="checkbox"][name="${checkboxName}"]`,
            );
            const selectedOptions = [];

            checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    selectedOptions.push(checkbox.value);
                }
            });

            if (selectedOptions.length === 0) {
                bulmaToast.toast({
                    message: `Hey there, please pick at least one option.😊👌`,
                    type: "is-warning is-size-6 p-3",
                    duration: 4000,
                    position: "top-center",
                    closeOnClick: true,
                });
            } else {
                // Perform your action based on the selected options
                // Perform your action based on the selected options
                if (selectedOptions.join(", ") == "option01") {
                    captureAndSaveViewportAsPng(cy);
                    modal.classList.remove("is-active");
                } else if (selectedOptions.join(", ") == "option02") {
                    captureAndSaveViewportAsDrawIo(cy);
                    modal.classList.remove("is-active");
                } else if (selectedOptions.join(", ") == "option01, option02") {
                    captureAndSaveViewportAsPng(cy);
                    sleep(5000);
                    captureAndSaveViewportAsDrawIo(cy);
                    modal.classList.remove("is-active");
                }
            }
        });

        // show modal
        // show modal
        modal = document.getElementById(modalId);
        modal.classList.add("is-active");
    }

    // 
    // End of JS Generic Functions section
    // End of JS Generic Functions section
    // 
    // 
    // End of JS Generic Functions section
    // End of JS Generic Functions section
    // 
});

// aarafat-tag:
//// REFACTOR START
//// to-do:
////  - re-create about-panel
////  - re-create log-messages
////  - re-create viewport


async function sshWebBased(event) {
    console.log("sshWebBased: ", globalSelectedNode)
    var routerName = globalSelectedNode
    try {
        environments = await getEnvironments(event);
        console.log("sshWebBased - environments: ", environments)
        cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
        routerData = findCytoElementByLongname(cytoTopologyJson, routerName)

        console.log("sshWebBased: ", `${globalShellUrl}?RouterID=${routerData["data"]["extraData"]["mgmtIpv4Addresss"]}?RouterName=${routerName}`)

        window.open(`${globalShellUrl}?RouterID=${routerData["data"]["extraData"]["mgmtIpv4Addresss"]}?RouterName=${routerName}`);

    } catch (error) {
        console.error('Error executing restore configuration:', error);
    }
}

async function sshCliCommandCopy(event) {
    console.log("sshWebBased: ", globalSelectedNode)
    var routerName = globalSelectedNode
    try {
        environments = await getEnvironments(event);
        console.log("sshWebBased - environments: ", environments)

        cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
        clabServerAddress = environments["clab-server-address"]
        routerData = findCytoElementByLongname(cytoTopologyJson, routerName)
        clabUser = routerData["data"]["extraData"]["clabServerUsername"]

        sshCopyString = `ssh -t ${clabUser}@${clabServerAddress} "ssh admin@${routerName}"`

        // Check if the clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sshCopyString).then(function() {
                alert('Text copied to clipboard');
            }).catch(function(error) {
                console.error('Could not copy text: ', error);
            });
        } else {
            // Fallback method for older browsers
            let textArea = document.createElement('textarea');
            textArea.value = sshCopyString;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert('Text copied to clipboard');
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }

    } catch (error) {
        console.error('Error executing restore configuration:', error);
    }
}



async function linkImpairmentClab(event, impairDirection) {
    console.log("linkImpairmentClab - globalSelectedEdge: ", globalSelectedEdge)
    var edgeId = globalSelectedEdge
    try {
        environments = await getEnvironments(event);
        console.log("linkImpairment - environments: ", environments)

        var deploymentType = environments["deployment-type"]
        var command

        cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
        edgeData = findCytoElementById(cytoTopologyJson, edgeId)

        console.log("linkImpairment- edgeData: ", edgeData)
        console.log("linkImpairment- edgeSource: ", edgeData["data"]["source"])

        clabUser = edgeData["data"]["extraData"]["clabServerUsername"]
        clabServerAddress = environments["clab-server-address"]
        clabSourceLongName = edgeData["data"]["extraData"]["clabSourceLongName"]
        clabSourcePort = edgeData["data"]["extraData"]["clabSourcePort"]

        clabTargetLongName = edgeData["data"]["extraData"]["clabTargetLongName"]
        clabTargetPort = edgeData["data"]["extraData"]["clabTargetPort"]

        if (impairDirection == "a-to-b") {
            console.log("linkImpairment - impairDirection: ", impairDirection)

            delayValue = document.getElementById("panel-link-endpoint-a-delay").value
            jitterValue = document.getElementById("panel-link-endpoint-a-jitter").value
            rateValue = document.getElementById("panel-link-endpoint-a-rate").value
            lossValue = document.getElementById("panel-link-endpoint-a-loss").value

            if (deploymentType == "container") {
                command = `ssh ${clabUser}@${clabServerAddress} /usr/bin/containerlab tools netem set -n ${clabSourceLongName} -i ${clabSourcePort} --delay ${delayValue}ms --jitter ${jitterValue}ms --rate ${rateValue} --loss ${lossValue}`
            } else if (deploymentType == "colocated") {
                command = `/usr/bin/containerlab tools netem set -n ${clabSourceLongName} -i ${clabSourcePort} --delay ${delayValue}ms --jitter ${jitterValue}ms --rate ${rateValue} --loss ${lossValue}`
            }

            console.log(`linkImpairment - deployment ${deploymentType}, command: ${command}`)
            var postPayload = []
            postPayload[0] = command
            await sendRequestToEndpointPost("/clab-link-impairment", postPayload)

        } else if (impairDirection == "b-to-a") {
            console.log("linkImpairment - impairDirection: ", impairDirection)

            delayValue = document.getElementById("panel-link-endpoint-b-delay").value
            jitterValue = document.getElementById("panel-link-endpoint-b-jitter").value
            rateValue = document.getElementById("panel-link-endpoint-b-rate").value
            lossValue = document.getElementById("panel-link-endpoint-b-loss").value

            command = `ssh ${clabUser}@${clabServerAddress} /usr/bin/containerlab tools netem set -n ${clabSourceLongName} -i ${clabSourcePort} --delay ${delayValue}ms --jitter ${jitterValue}ms --rate ${rateValue} --loss ${lossValue}`
            console.log("linkImpairment - command: ", command)
        }

    } catch (error) {
        console.error('Error executing linkImpairment configuration:', error);
    }
}


async function linkWireshark(event, option, endpoint) {
    console.log("linkWireshark - globalSelectedEdge: ", globalSelectedEdge)
    var edgeId = globalSelectedEdge
    try {
        environments = await getEnvironments(event);
        console.log("linkWireshark - environments: ", environments)

        var deploymentType = environments["deployment-type"]

        cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
        edgeData = findCytoElementById(cytoTopologyJson, edgeId)

        console.log("linkWireshark- edgeData: ", edgeData)
        console.log("linkWireshark- edgeSource: ", edgeData["data"]["source"])

        clabUser = edgeData["data"]["extraData"]["clabServerUsername"]
        clabServerAddress = environments["clab-server-address"]

        clabSourceLongName = edgeData["data"]["extraData"]["clabSourceLongName"]
        clabSourcePort = edgeData["data"]["extraData"]["clabSourcePort"]

        clabTargetLongName = edgeData["data"]["extraData"]["clabTargetLongName"]
        clabTargetPort = edgeData["data"]["extraData"]["clabTargetPort"]

        if (option == "app") {
            if (endpoint == "source") {
                wiresharkHref = `clab-capture://${clabUser}@${clabServerAddress}?${clabSourceLongName}?${clabSourcePort}`
                console.log("linkWireshark- wiresharkHref: ", wiresharkHref)

            } else if (endpoint == "target") {
                wiresharkHref = `clab-capture://${clabUser}@${clabServerAddress}?${clabTargetLongName}?${clabTargetPort}`
                console.log("linkWireshark- wiresharkHref: ", wiresharkHref)
            }

            window.open(wiresharkHref);

        } else if (option == "copy") {
            if (endpoint == "source") {
                if (deploymentType == "container") {
                    wiresharkSshCommand = `ssh ${clabUser}@${clabServerAddress} "sudo -S /sbin/ip netns exec ${clabSourceLongName} tcpdump -U -nni ${clabSourcePort} -w -" | wireshark -k -i -`
                } else if (deploymentType == "colocated") {
                    wiresharkSshCommand = `ssh ${clabUser}@${clabServerAddress} "sudo -S /sbin/ip netns exec ${clabSourceLongName} tcpdump -U -nni ${clabSourcePort} -w -" | wireshark -k -i -`
                }
            } else if  (endpoint == "target") {
                if (deploymentType == "container") {
                    wiresharkSshCommand = `ssh ${clabUser}@${clabServerAddress} "sudo -S /sbin/ip netns exec ${clabTargetLongName} tcpdump -U -nni ${clabTargetPort} -w -" | wireshark -k -i -`
                } else if (deploymentType == "colocated") {
                    wiresharkSshCommand = `ssh ${clabUser}@${clabServerAddress} "sudo -S /sbin/ip netns exec ${clabTargetLongName} tcpdump -U -nni ${clabTargetPort} -w -" | wireshark -k -i -`
                }
            }

            console.log("linkWireshark- wiresharkSShCommand: ", wiresharkSshCommand)

            // Check if the clipboard API is available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(wiresharkSshCommand).then(function() {
                    alert('Text copied to clipboard');
                }).catch(function(error) {
                    console.error('Could not copy text: ', error);
                });
            } else {
                // Fallback method for older browsers
                let textArea = document.createElement('textarea');
                textArea.value = wiresharkSshCommand;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert('Text copied to clipboard');
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textArea);
            }

        }

    } catch (error) {
        console.error('Error executing linkImpairment configuration:', error);
    }
}

async function showPanelLogMessages(event) {
    document.getElementById("panel-log-messages").style.display = "block";
}

///-logMessagesPanel Function to add a click event listener to the close button
document.getElementById("panel-log-messages-close-button").addEventListener("click", () => {
    document.getElementById("panel-log-messages").style.display = "none";
});

async function showPanelTopoViewerClient(event) {
    // Remove all Overlayed Panel
    // Get all elements with the class "panel-overlay"
    var panelOverlays = document.getElementsByClassName("panel-overlay");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < panelOverlays.length; i++) {
        panelOverlays[i].style.display = "none";
    }

    environments = await getEnvironments(event);
    console.log("linkImpairment - environments: ", environments)

    clabServerAddress = environments["clab-server-address"]
    clabServerPort = environments["clab-server-port"]

    hrefWindows = `http://${clabServerAddress}:${clabServerPort}/clab-client/clab-client-windows/ClabCapture.app.zip`
    hrefMac = `http://${clabServerAddress}:${clabServerPort}/clab-client/clab-client-mac/ClabCapture.app.zip`

    document.getElementById("panel-topoviewer-helper").style.display = "block";

    const htmlContent = `
            <h6>Wireshark Capture</h6>
            <p>
                Please download the following helper app:
            </p>
            <ul>
                <li><a href="${hrefWindows}">Windows version</a> </li>
                <li><a href="${hrefMac}">MAC version</a> </li>
            </ul>
            <p>
                TopoViewer offers a remote capture feature for intercepting ContainerLab node endpoints. 
                For the best experience, it's recommended to have both TopoViewer and its helper app installed on client-side. 
                With the TopoViewer helper app, you can effortlessly automate the launch of Wireshark's GUI. 
            </p>
            <p>
                Alternatively, if you don't have the helper app, you can simply copy and paste an SSH command to initiate Wireshark manually. 
                This setup provides flexibility in how you utilize this feature. <br>
            </p>
    `;
    document.getElementById("panel-topoviewer-helper-content").innerHTML = htmlContent;
}

async function showPanelAbout(event) {
    // Remove all Overlayed Panel
    // Get all elements with the class "panel-overlay"
    var panelOverlays = document.getElementsByClassName("panel-overlay");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < panelOverlays.length; i++) {
        panelOverlays[i].style.display = "none";
    }

    environments = await getEnvironments(event);
    console.log("linkImpairment - environments: ", environments)

    topoViewerVersion = environments["topoviewer-version"]

    document.getElementById("panel-topoviewer-about").style.display = "block";

    const htmlContent = `
        <div class="content is-small pb-2">
            <h6>Version: ${topoViewerVersion}</h6>
            
            <p>
            Designed and developed by <strong><a href="https://www.linkedin.com/in/asadarafat/">Asad Arafat</a></strong> <br>
            </p>
            <p>
            Special Thanks:
                <ul>
                    <li><strong><a href="https://www.linkedin.com/in/siva19susi/">Siva Sivakumar</a></strong> - For pioneering the integration of Bulma CSS, significantly enhancing TopoViewer design and usability.</li>
                    <li><strong><a href="https://www.linkedin.com/in/gatot-susilo-b073166//">Gatot Susilo</a></strong> - For seamlessly incorporating TopoViewer into the Komodo2 tool, bridging functionality with innovation.</li>
                    <li><strong><a href="https://www.linkedin.com/in/gusman-dharma-putra-1b955117/">Gusman Dharma Putra</a></strong> - For his invaluable contribution in integrating TopoViewer into Komodo2, enriching its capabilities.</li>
                    <li><strong><a href="https://www.linkedin.com/in/sven-wisotzky-44788333/">Sven Wisotzky</a></strong> - For offering insightful feedback that led to significant backend optimizations.</li>
                </ul>
            </p>


        </div>
    `;
    document.getElementById("panel-topoviewer-about-content").innerHTML = htmlContent;
}

async function sidebarButtonFitScreen(event) {

    // --sidebar-button-background-color-default: rgba(54,58, 69, 1);
    // --sidebar-button-background-color-active:  rgba(76, 82, 97, 1);

    var sidebarButtonFitScreen = document.getElementById("sidebar-button-fit-screen")
    const sidebarButtonColorDefault = getComputedStyle(sidebarButtonFitScreen).getPropertyValue('--sidebar-button-background-color-default');
    const sidebarButtonColorActive = getComputedStyle(sidebarButtonFitScreen).getPropertyValue('--sidebar-button-background-color-active');

    drawer = document.getElementById("drawer")
    if (drawer.style.display === 'block') {
            drawer.style.display = 'none';
            var sidebarButtonFitScreen = document.getElementById("sidebar-button-fit-screen")
            sidebarButtonFitScreen.style.background = sidebarButtonColorDefault.trim();
            sidebarButtonFitScreen.style.border = sidebarButtonColorActive.trim();
        } else {
            drawer.style.display = 'block';
            var sidebarButtons = document.getElementsByClassName("is-sidebar");
            // Loop through each element and set its display to 'none'
            for (var i = 0; i < sidebarButtons.length; i++) {
                sidebarButtons[i].style.background = sidebarButtonColorDefault.trim();
                sidebarButtons[i].style.border = sidebarButtonColorDefault.trim();
            }
            sidebarButtonFitScreen.style.background = sidebarButtonColorActive.trim();
        }

}

async function getActualNodesEndpoints(event) {
    try {
        bulmaToast.toast({
            message: `Getting Actual Nodes Endpoint Labesl... Hold on..! 🚀💻`,
            type: "is-warning is-size-6 p-3",
            duration: 4000,
            position: "top-center",
            closeOnClick: true,
        });
        appendMessage(
           `Getting Actual Nodes Endpoint Labesl... Hold on..! 🚀💻`,
        );

        showLoadingSpinnerGlobal()
        const CyTopoJson = await  sendRequestToEndpointGet("/actual-nodes-endpoints", argsList = []) 
        // Handle the response data
        if (CyTopoJson && typeof CyTopoJson === 'object' && Object.keys(CyTopoJson).length > 0) {
            hideLoadingSpinner();
            console.log("Valid non-empty JSON response received:", CyTopoJson);

            hideLoadingSpinnerGlobal();

            return CyTopoJson
        
        } else {

            hideLoadingSpinnerGlobal();

            console.log("Empty or invalid JSON response received");
        }
    } catch (error) {
        hideLoadingSpinnerGlobal();
        console.error("Error occurred:", error);
        // Handle errors as needed
    }
}

function viewportButtonsZoomToFit() {
    const initialZoom = cy.zoom();
    appendMessage(`Bro, initial zoom level is "${initialZoom}".`);
    //- Fit all nodes possible with padding
    //- Fit all nodes possible with padding
    cy.fit();
    const currentZoom = cy.zoom();
    appendMessage(`And now the zoom level is "${currentZoom}".`);
}

function viewportButtonsLayoutAlgo() {
    viewportDrawerLayout = document.getElementById("viewport-drawer-layout")
    viewportDrawerLayout.style.display = "block"
}




async function layoutAlgoChange(event) {
    try {
        console.log("layoutAlgoChange clicked");

        var selectElement = document.getElementById("select-layout-algo");
        var selectedOption = selectElement.value;

        if (selectedOption === "Force Directed") {
            console.log("Force Directed algo selected");

            var layoutAlgoPanels = document.getElementsByClassName("layout-algo");
            // Loop through each element and set its display to 'none'
            for (var i = 0; i < layoutAlgoPanels.length; i++) {
                layoutAlgoPanels[i].style.display = "none";
            }

            viewportDrawerForceDirected = document.getElementById("viewport-drawer-force-directed")
            viewportDrawerForceDirected.style.display = "block"

            viewportDrawerForceDirectedResetStart = document.getElementById("viewport-drawer-force-directed-reset-start")
            viewportDrawerForceDirectedResetStart.style.display = "block"

            console.log(document.getElementById("viewport-drawer-force-directed"))
            console.log(document.getElementById("viewport-drawer-force-directed-reset-start"))

        } else if (selectedOption === "Vertical") {
            console.log("Vertical algo selected");
    
            var layoutAlgoPanels = document.getElementsByClassName("layout-algo");
            // Loop through each element and set its display to 'none'
            for (var i = 0; i < layoutAlgoPanels.length; i++) {
                layoutAlgoPanels[i].style.display = "none";
            }
    
            viewportDrawerForceDirected = document.getElementById("viewport-drawer-dc-vertical")
            viewportDrawerForceDirected.style.display = "block"
    
            viewportDrawerForceDirectedResetStart = document.getElementById("viewport-drawer-dc-vertical-reset-start")
            viewportDrawerForceDirectedResetStart.style.display = "block"
    
            console.log(document.getElementById("viewport-drawer-dc-vertical"))
            console.log(document.getElementById("viewport-drawer-dc-vertical-reset-start"))

        } else if (selectedOption === "Horizontal") {
            console.log("Horizontal algo selected");
    
            var layoutAlgoPanels = document.getElementsByClassName("layout-algo");
            // Loop through each element and set its display to 'none'
            for (var i = 0; i < layoutAlgoPanels.length; i++) {
                layoutAlgoPanels[i].style.display = "none";
            }
    
            viewportDrawerForceDirected = document.getElementById("viewport-drawer-dc-horizontal")
            viewportDrawerForceDirected.style.display = "block"
    
            viewportDrawerForceDirectedResetStart = document.getElementById("viewport-drawer-dc-horizontal-reset-start")
            viewportDrawerForceDirectedResetStart.style.display = "block"
    
            console.log(document.getElementById("viewport-drawer-dc-horizontal"))
            console.log(document.getElementById("viewport-drawer-dc-horizontal-reset-start"))
        }

    }catch (error) {
        console.error("Error occurred:", error);
        // Handle errors as needed
    }
}


function viewportButtonsTopologyOverview() {

    console.log("viewportButtonsTopologyOverview clicked")
    viewportDrawerLayout = document.getElementById("viewport-drawer-topology-overview")
    viewportDrawerLayout.style.display = "block"

    viewportDrawerLayoutContent = document.getElementById("viewport-drawer-topology-overview-content")
    viewportDrawerLayoutContent.style.display = "block"
}

function viewportButtonsTopologyCapture() {

    console.log("viewportButtonsTopologyCapture clicked")

    viewportDrawerCapture = document.getElementById("viewport-drawer-capture-sceenshoot")
    viewportDrawerCapture.style.display = "block"

    viewportDrawerCaptureContent = document.getElementById("viewport-drawer-capture-sceenshoot-content")
    viewportDrawerCaptureContent.style.display = "block"
}



// aarafat-tag:
//// REFACTOR END




// Call createContentPanel with the panel ID and an array of tab content functions
// The Tab name will be auto generate by the tabFunction names, ie: funtion name: createNetworkExplorerTab --> tab name: NetworkExplorer
// Call createContentPanel with the panel ID and an array of tab content functions
// The Tab name will be auto generate by the tabFunction names, ie: funtion name: createNetworkExplorerTab --> tab name: NetworkExplorer
function createContentPanel(
    panelId,
    tabContentFns,
    tabContentFnsArg,
    panelHeadingText,
) {
    appendMessage(`"createContentPanel reach:`);

    const tabNames = tabContentFns.map((fn) => fn.name);

    const panel = document.createElement("div");
    panel.className = "panel is-link";
    panel.id = panelId;
    panel.style.display = "block";

    const panelHeading = document.createElement("p");
    panelHeading.className = "panel-heading is-size-7";
    panelHeading.textContent = panelHeadingText;

    const panelTabs = document.createElement("p");
    panelTabs.className = "panel-tabs";

    const tabContainers = [];

    // Check if the tabContentFns have more than 1 element
    // Check if the tabContentFns have more than 1 element
    if (tabContentFns.length != 1) {
        for (let i = 0; i < tabNames.length; i++) {
            const name = tabNames[i];
            const tab = document.createElement("a");
            tab.className = "toggle-Panel01-tab is-smallish has-text-weight-medium";
            tab.setAttribute("data-target", `${panelId}-Tab-${name}-Container`);
            tab.id = `${panelId}-Tab-${name}-Button`;
            tab.textContent = name.replace(/^create|Tab$/g, "");

            panelTabs.appendChild(tab);

            const tabContainer = document.createElement("div");
            tabContainer.className = "panel-tabContainer";
            tabContainer.id = `${panelId}-Tab-${name}-Container`;

            tabContainers.push(tabContainer);

            // Generate tab content using the provided function from tabContentFns
            // Generate tab content using the provided function from tabContentFns
            if (tabContentFns[i] && typeof tabContentFns[i] === "function") {
                const tabContent = tabContentFns[i]();
                tabContainer.appendChild(tabContent);
            }
            panel.appendChild(panelHeading);
            panel.appendChild(panelTabs);
        }
    } else {
        const tabContainer = document.createElement("div");
        tabContainer.className = "panel-tabContainer";
        tabContainer.id = `${panelId}-Tab-${name}-Container`;
        tabContainers.push(tabContainer);

        // Generate tab content using the provided function from tabContentFns
        // Generate tab content using the provided function from tabContentFns
        if (tabContentFns[0] && typeof tabContentFns[0] === "function") {
            const tabContent = tabContentFns[0](tabContentFnsArg, panelHeadingText);
            console.log("tabContentFnsArg");

            console.log(tabContentFnsArg);
            panel.appendChild(panelHeading);
            panel.appendChild(tabContent);
        }
    }

    // Check if the tabContentFns have more than 1 element
    // Check if the tabContentFns have more than 1 element
    if (tabContentFns.length != 1) {
        // initial hide all tab and only opent the first tab
        // initial hide all tab and only opent the first tab
        for (const tabContainer of tabContainers) {
            tabContainer.style.display = "none";
            panel.appendChild(tabContainer);
        }
        tabContainers[0].style.display = "block";
    }

    document.body.appendChild(panel);

    const toggleButtons = document.querySelectorAll(".toggle-Panel01-tab");

    toggleButtons.forEach((tab) => {
        tab.addEventListener("click", () => {
            const targetTabId = tab.getAttribute("data-target");
            const selectedTabContainer = document.getElementById(targetTabId);

            // Hide all tab containers
            // Hide all tab containers
            tabContainers.forEach((container) => {
                container.style.display = "none";
            });

            // Show the selected tab container
            // Show the selected tab container
            selectedTabContainer.style.display = "block";

            console.log(`Panel-${targetTabId} is displayed.`);
            appendMessage(`Panel-${targetTabId} is displayed.`);
        });
    });
}

// logMessagesPanel manager
///-logMessagesPanel Function to append message function
// logMessagesPanel manager
///-logMessagesPanel Function to append message function
function appendMessage(message) {
    // const textarea = document.getElementById('notificationTextarea');
    // const textarea = document.getElementById('notificationTextarea');
    const textarea = document.getElementById("notificationTextarea");

    // Get the current date and time
    // Get the current date and time
    const timestamp = new Date().toLocaleString();

    textarea.value += `[${timestamp}] ${message}\n`;
    textarea.scrollTop = textarea.scrollHeight;
}

function createPanelBlockContainer(tabContainerId) {
    // this is helper function to create PanelBlock-Container
    // this is helper function to create PanelBlock-Container
    const panelBlock = document.createElement("div");
    panelBlock.id = `panelBlock-${tabContainerId}`;
    panelBlock.className = "panel-block py-2";

    const divPanelBlock = document.createElement("div");
    divPanelBlock.id = `${panelBlock.id}-divPanelBlock`;
    divPanelBlock.className = "column p-0";

    return {
        panelBlock: panelBlock,
        divPanelBlock: divPanelBlock,
    };
}

function createPanelBlockForm(
    PanelColumnsConfig,
    panelBlock,
    divPanelBlock,
    cy,
) {

    PanelColumnsConfig.forEach((config) => {
            // Create columnContainer
            // Create columnContainer
            const columnContainer = document.createElement("div");
            columnContainer.id = `${divPanelBlock.id}-columnContainer${config.idSuffix}`;
            columnContainer.className = "column my-auto is-11 pr-1";

            // Create panelContent
            // Create panelContent
            const panelContent = document.createElement("div");
            panelContent.id = `${columnContainer.id}-panelContent${config.idSuffix}`;
            panelContent.className = "panel-content";

            // Create columnsPanelContent container
            // Create columnsPanelContent container
            const columnsPanelContent = document.createElement("div");
            columnsPanelContent.className = "columns py-auto";
            columnsPanelContent.id = `${panelContent.id}-columnsPanelContent${config.idSuffix}`;

            // Create labelColumn column
            // Create labelColumn column
            const labelColumn = document.createElement("div");
            labelColumn.id = `${columnsPanelContent.id}-labelColumn${config.idSuffix}`;
            labelColumn.className = `${config.columnLabelClass}`;

            const labelElement = document.createElement("label");
            if (
                typeof config.columnLabelElementClass !== "undefined" &&
                config.columnLabelElementClass !== null &&
                config.columnLabelElementClass !== ""
            ) {
                labelElement.className = config.columnLabelElementClass;
            } else {
                labelElement.className =
                    "label is-size-7 has-text-right has-text-weight-medium px-auto";
            }

            labelElement.textContent = config.columnLabelTextContent;
            labelElement.id = `${labelColumn.id}-labelElement${config.idSuffix}`;

            labelColumn.appendChild(labelElement);
            columnsPanelContent.appendChild(labelColumn);

            // Create inputColumn column
            // Create inputColumn column
            if (config.columnInputType == "label") {
                const inputColumn = document.createElement("div");
                inputColumn.className = `column is-8 p-1 pl-3`;
                inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`;

                const inputElement = document.createElement("label");
                inputElement.className = `label is-size-7 has-text-left link-impairment-widht has-text-weight-normal mr-0 is-max-content`;
                inputElement.id = `${inputColumn.id}-label${config.idSuffix}`;
                inputElement.textContent = config.columnInputContent;

                inputColumn.appendChild(inputElement);
                columnsPanelContent.appendChild(inputColumn);
            } else if (config.columnInputType == "button") {
                const inputColumn = document.createElement("div");
                if (
                    typeof config.columnInputClass !== "undefined" &&
                    config.columnInputClass !== null &&
                    config.columnInputClass !== ""
                ) {
                    inputColumn.className = config.columnInputClass;
                } else {
                    inputColumn.className = `column is-8 p-1 pl-3`;
                }
                inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`;

                const inputElement = document.createElement("button");
                if (
                    typeof config.columnInputElementClass !== "undefined" &&
                    config.columnInputElementClass !== null &&
                    config.columnInputElementClass !== ""
                ) {
                    inputElement.className = config.columnInputElementClass;
                } else {
                    inputElement.className = `button is-size-7 is-smallest-element is-justify-content-flex-end`;
                }

                inputElement.id = `${inputColumn.id}-inputElement${config.idSuffix}`;
                inputElement.textContent = config.columnInputContent;
                inputElement.style.width = "50";

                inputElementIconSpan = document.createElement("span");
                inputElementIconSpan.id = `${inputElement.id}-inputElementIconSpan${config.idSuffix}`;
                inputElementIconSpan.className = config.columnInputContentIconSpanClass;

                inputElementIconInlineElement = document.createElement("i");
                inputElementIconInlineElement.id = `${inputElementIconSpan.id}-inputElementIconInlineElement${config.idSuffix}`;
                inputElementIconInlineElement.className =
                    config.columnInputContentIconInlineElementClass;

                inputElementIconSpanButtonLabel = document.createElement("span");
                inputElementIconSpanButtonLabel.id = `${inputElement.id}-inputElementIconSpanButtonLabel${config.idSuffix}`;

                inputElementIconSpan.appendChild(inputElementIconInlineElement);
                inputElement.appendChild(inputElementIconSpanButtonLabel);
                inputElement.appendChild(inputElementIconSpan);

                inputElement.addEventListener("click", function() {
                    console.log(
                        "config.columnInputCallOutFuntionName: ",
                        config.columnInputCallOutFuntionName,
                    );
                    eval(config.columnInputCallOutFuntionName + `(cy)`);
                });

                inputColumn.appendChild(inputElement);
                columnsPanelContent.appendChild(inputColumn);
            } else if (config.columnInputType == "slider") {
                const inputColumn = document.createElement("div");
                inputColumn.className = `column is-5 p-1 pl-2`;
                inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`;

                const inputElement = document.createElement("input");
                inputElement.className = `slider custom-slider`;
                inputElement.style.width = `100px`;

                inputElement.step = "1";
                inputElement.min = "1";
                inputElement.max = "1000";
                inputElement.value = "50";
                inputElement.type = "range";

                inputElement.id = `${inputColumn.id}-label${config.idSuffix}`;
                inputElement.textContent = config.columnInputContent;

                inputColumn.appendChild(inputElement);
                columnsPanelContent.appendChild(inputColumn);
            } else if (config.columnInputType == "input") {
                const inputColumn = document.createElement("div");
                if (
                    typeof config.columnInputClass !== "undefined" &&
                    config.columnInputClass !== null &&
                    config.columnInputClass !== ""
                ) {
                    inputColumn.className = config.columnInputClass;
                } else {
                    inputColumn.className = `column is-8 p-1 pl-3`;
                }
                // inputColumn.className = `column is-8 p-1 pl-3`;
                // inputColumn.className = `column is-8 p-1 pl-3`;
                inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`;
                const inputElement = document.createElement("input");
                if (
                    typeof config.columnInputElementClass !== "undefined" &&
                    config.columnInputElementClass !== null &&
                    config.columnInputElementClass !== ""
                ) {
                    inputElement.className = config.columnInputElementClass;
                } else {
                    inputElement.className = `input is-size-7 has-text-left link-impairment-widht has-text-weight-normal is-smallest-element`;
                }
                // inputElement.className = `input is-size-7 has-text-left link-impairment-widht has-text-weight-normal is-smallest-element`;
                // inputElement.className = `input is-size-7 has-text-left link-impairment-widht has-text-weight-normal is-smallest-element`;
                inputElement.id = `${inputColumn.id}-label${config.idSuffix}`;
                inputElement.type = "text";
                inputElement.value = config.columnInputContent;
                inputElement.placeholder = config.columnInputPlaceholder;

                inputColumn.appendChild(inputElement);
                columnsPanelContent.appendChild(inputColumn);
            } else if (config.columnInputType == "field") {
                const inputColumn = document.createElement("div");
                inputColumn.className = `column is-8 p-1 pl-3`;
                inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`;

                const inputElement = document.createElement("div");
                inputElement.className = `field has-addons`;
                inputElement.id = `${inputColumn.id}-label${config.idSuffix}`;
                if (config.columnInputIsInvisible == "yes") {
                    inputElement.classList.add("is-invisible");
                }

                // create addon input
                // create addon input
                const controlId = `${inputElement.id}-control`;
                const control = document.createElement("p");
                control.className = "control";
                control.id = controlId;
                const input = document.createElement("input");
                input.id = `${controlId}-input`;

                if (config.columnInputAttribute == "enabled") {
                    input.setAttribute("enabled", "");
                } else {
                    input.setAttribute("disabled", "");
                }

                input.className = `label is-size-7 has-text-left has-text-weight-normal is-flex-wrap-wrap is-smallest-element`;
                input.value = config.columnInputContent;
                input.placeholder = config.columnInputPlaceholder;

                control.appendChild(input);
                inputElement.appendChild(control);

                // create addon button
                // create addon button
                addons = config.addonsContent;

                for (let i = 0; i < addons.length; i++) {
                    const addon = addons[i];
                    const controlId = `${inputElement.id}-control${addon.name}`;
                    const control = document.createElement("p");
                    control.className = "control";
                    control.id = controlId;

                    // Create a button element
                    // Create a button element
                    const button = document.createElement("a");
                    button.id = `${controlId}-button${addon.name}`;
                    button.className = `button is-outlined px-3 is-smallest-element is-${addon.name === "blue" ? "link" : "success"}`;

                    if (addon.hrefFunction == "link") {
                        button.href = addon.hrefLink;
                        button.target = "_blank";
                    } else if (addon.hrefFunction == "eventHandlerLink") {
                        button.addEventListener("click", function() {
                            console.log("addon.callOutFuntionName", addon.callOutFuntionName);
                            eval(addon.callOutFuntionName + `(cy)`);
                        });
                    } else if (addon.hrefFunction == "copy") {
                        button.href = addon.hrefLink;
                        button.target = "_blank";
                        button.addEventListener("click", function(event) {
                            // Prevent the default behavior of the anchor element (opening a new tab)
                            // Prevent the default behavior of the anchor element (opening a new tab)
                            urlToCopy = addon.hrefLink;
                            event.preventDefault();

                            // Create a temporary input element to copy the URL to the clipboard
                            // Create a temporary input element to copy the URL to the clipboard
                            const tempInput = document.createElement("input");
                            tempInput.value = urlToCopy;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand("copy");
                            document.body.removeChild(tempInput);

                            // Provide user feedback (e.g., alert or toast) that the URL has been copied
                            // Provide user feedback (e.g., alert or toast) that the URL has been copied
                            bulmaToast.toast({
                                message: `SSH command is lit 🔥 and copied to your clipboard, ready to drop it in your terminal console like a boss! 🚀💻`,
                                type: "is-warning is-size-6 p-3",
                                duration: 4000,
                                position: "top-center",
                                closeOnClick: true,
                            });
                            appendMessage(
                                `SSH command is lit 🔥 and copied to your clipboard, ready to drop it in your terminal console like a boss! 🚀💻`,
                            );
                        });
                    }

                    // Create a icon element
                    // Create a icon element
                    const icon = document.createElement("span");
                    icon.className = "icon is-small";
                    const iconElement = document.createElement("i");
                    iconElement.className = addon.iconClass;
                    icon.appendChild(iconElement);
                    button.appendChild(icon);

                    // Create a hover text paragraph element
                    // Create a hover text paragraph element
                    const hoverText = document.querySelector(".hover-text");

                    // Add event listeners for hover behavior
                    // Add event listeners for hover behavior
                    button.addEventListener("mouseover", () => {
                        // Calculate the position for the hover text
                        // Calculate the position for the hover text
                        const rect = button.getBoundingClientRect();
                        const top = rect.top - hoverText.offsetHeight + 25;
                        const left = rect.left + (button.offsetWidth - hoverText.offsetWidth) / 2;

                        // Set the position and show the hover text
                        // Set the position and show the hover text
                        hoverText.style.top = `${top}px`;
                        hoverText.style.left = `${left}px`;
                        hoverText.classList.remove("is-hidden");
                        hoverText.textContent = addon.hoverMessage;
                    });
                    button.addEventListener("mouseout", () => {
                        // Hide the hover text
                        // Hide the hover text
                        hoverText.classList.add("is-hidden");
                    });
                    control.appendChild(button);
                    inputElement.appendChild(control);
                }
                inputColumn.appendChild(inputElement);
                columnsPanelContent.appendChild(inputColumn);
            }
            // columnInputType buttonGroupHandle
            // columnInputType buttonGroupHandle
            else if (config.columnInputType == "selectGroup") {
                const inputColumn = document.createElement("div");
                if (
                    typeof config.columnInputClass !== "undefined" &&
                    config.columnInputClass !== null &&
                    config.columnInputClass !== ""
                ) {
                    inputColumn.className = config.columnInputClass;
                } else {
                    inputColumn.className = `column is-8 p-1 pl-3`;
                }
                inputColumn.id = `${labelColumn.id}-inputColumn${config.idSuffix}`;

                const inputElement = document.createElement("div");
                inputElement.className = `field has-addons`;
                inputElement.id = `${inputColumn.id}-label${config.idSuffix}`;
                if (config.columnInputIsInvisible == "yes") {
                    inputElement.classList.add("is-invisible");
                }

                // create addon select
                // create addon select
                addons = config.addonsContent;

                for (let i = 0; i < addons.length; i++) {
                    const addon = addons[i];
                    const controlId = `${inputElement.id}-control${addon.name}`;
                    const control = document.createElement("p");
                    control.className = "control";
                    control.id = controlId;

                    // Create a select element
                    // Create a select element
                    const select = document.createElement("a");
                    select.id = `${controlId}-select${addon.name}`;
                    select.className = `select is-outlined px-3 is-smallest-element is-${addon.name === "blue" ? "link" : "success"}`;

                    if (addon.hrefFunction == "link") {
                        select.href = addon.hrefLink;
                        select.target = "_blank";
                    } else if (addon.hrefFunction == "eventHandlerLink") {
                        select.addEventListener("click", function() {
                            console.log("addon.callOutFuntionName", addon.callOutFuntionName);
                            eval(addon.callOutFuntionName + `(cy)`);
                        });
                    }

                    // Create a icon element
                    // Create a icon element
                    const icon = document.createElement("span");
                    icon.className = "icon is-small";
                    const iconElement = document.createElement("i");
                    iconElement.className = addon.iconClass;
                    icon.appendChild(iconElement);
                    select.appendChild(icon);

                    // Create a hover text paragraph element
                    // Create a hover text paragraph element
                    const hoverText = document.querySelector(".hover-text");

                    // Add event listeners for hover behavior
                    // Add event listeners for hover behavior
                    select.addEventListener("mouseover", () => {
                        // Calculate the position for the hover text
                        // Calculate the position for the hover text
                        const rect = select.getBoundingClientRect();
                        const top = rect.top - hoverText.offsetHeight + 25;
                        const left = rect.left + (select.offsetWidth - hoverText.offsetWidth) / 2;

                        // Set the position and show the hover text
                        // Set the position and show the hover text
                        hoverText.style.top = `${top}px`;
                        hoverText.style.left = `${left}px`;
                        hoverText.classList.remove("is-hidden");
                        hoverText.textContent = addon.hoverMessage;
                    });
                    select.addEventListener("mouseout", () => {
                        // Hide the hover text
                        // Hide the hover text
                        hoverText.classList.add("is-hidden");
                    });
                    control.appendChild(select);
                    inputElement.appendChild(control);
                }
                inputColumn.appendChild(inputElement);
                columnsPanelContent.appendChild(inputColumn);
            }

            panelContent.appendChild(columnsPanelContent);
            columnContainer.appendChild(panelContent);
            divPanelBlock.appendChild(columnContainer);
        }

    );
}

function showPanelDrawerLayout() {
    removeElementById("Panel-03");
    tabContentFns = [createDrawerLayoutTab];
    tabContentFnsArg = [];
    createContentPanel(
        "Panel-03",
        tabContentFns,
        tabContentFnsArg,
        "TopoViewer Helper App",
    );

    // createContentPanel('Panel-01', tabContentFns, tabContentFnsArg[0], 'Node Properties');
    // createContentPanel('Panel-01', tabContentFns, tabContentFnsArg[0], 'Node Properties');
}

function createDrawerLayoutTab(panelHeadingText) {
    const modifiedHeaderText = panelHeadingText;

    // Create the tab-container
    // Create the tab-container
    const tabContainer = document.createElement("div");
    tabContainer.id = `tabContainer-${modifiedHeaderText}`;
    tabContainer.className = "panel-tabContainer";

    // Panel Block 01
    // Panel Block 01
    panelBlockContainer = createPanelBlockContainer(tabContainer.id);
    panelBlock01 = panelBlockContainer.panelBlock;
    divPanelBlock01 = panelBlockContainer.divPanelBlock;

    // Define the HTML content as a string
    // Define the HTML content as a string

    url = location.host;
    const hreWindows = `http://${url}/clab-client/clab-client-windows/ClabCapture.app.zip`;
    const hrefMac = `http://${url}/clab-client/clab-client-mac/ClabCapture.app.zip`;
    const htmlContent = `
                                            <div class="tabs is-boxed px-">
                                                <ul>
                                                    <li class="is-active">
                                                        <a>
                                                            <span class="icon is-small"><i class="fas fa-image" aria-hidden="true"></i></span>
                                                            <span></span>
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a>
                                                            <span class="icon is-small px-0"><i class="fas fa-music" aria-hidden="true"></i></span>
                                                            <span></span>
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a>
                                                            <span class="icon is-small"><i class="fas fa-film" aria-hidden="true"></i></span>
                                                            <span></span>
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a>
                                                            <span class="icon is-small"><i class="far fa-file-alt" aria-hidden="true"></i></span>
                                                            <span></span>
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                            `;

    // Create a div element and set its innerHTML to the defined HTML content
    // Create a div element and set its innerHTML to the defined HTML content
    const contentDiv = document.createElement("div");
    contentDiv.className = "px-2";
    contentDiv.innerHTML = htmlContent;
    contentDiv.style.maxHeight = "280px";
    contentDiv.style.overflowY = "auto";

    divPanelBlock01.appendChild(contentDiv);
    // append divPanelBlock01 --> panelBlock01 --> tabContainer
    // append divPanelBlock01 --> panelBlock01 --> tabContainer
    panelBlock01.append(divPanelBlock01);
    tabContainer.appendChild(panelBlock01);

    return tabContainer;
}

function nodeFindDrawer(cy) {
    //- Get a reference to your Cytoscape instance (assuming it's named 'cy')
    //- const cy = window.cy; //- Replace 'window.cy' with your actual Cytoscape instance
    //- Find the node with the specified name
    //- Get a reference to your Cytoscape instance (assuming it's named 'cy')
    //- const cy = window.cy; //- Replace 'window.cy' with your actual Cytoscape instance
    //- Find the node with the specified name
    const nodeName = document.getElementById(
        "panelBlock-viewportButtons-buttonfindNode-divPanelBlock-columnContainerlabelFindNodeNodeName-panelContentlabelFindNodeNodeName-columnsPanelContentlabelFindNodeNodeName-labelColumnlabelFindNodeNodeName-inputColumnlabelFindNodeNodeName-labellabelFindNodeNodeName",
    ).value;

    const node = cy.$(`node[name = "${nodeName}"]`);
    //- Check if the node exists
    //- Check if the node exists
    if (node.length > 0) {
        // console
        // console
        console.log("Info: " + 'Sweet! Node "' + nodeName + '" is in the house.');
        appendMessage("Info: " + 'Sweet! Node "' + nodeName + '" is in the house.');
        //- Apply a highlight style to the node
        //- Apply a highlight style to the node
        node.style({
            "border-color": "red",
            "border-width": "2px",
            "background-color": "yellow",
        });
        //- Zoom out on the node
        //- Zoom out on the node
        cy.fit();
        //- Zoom in on the node
        //- Zoom in on the node
        cy.animate({
            zoom: {
                level: 5,
                position: {
                    x: node.position("x"),
                    y: node.position("y"),
                },
                renderedPosition: {
                    x: node.renderedPosition("x"),
                    y: node.renderedPosition("y"),
                },
            },
            duration: 1500,
        });
    } else {
        console.error(
            `Bro, I couldn't find a node named "${nodeName}". Try another one.`,
        );
        appendMessage(
            `Bro, I couldn't find a node named "${nodeName}". Try another one.`,
        );
    }
}

function pathFinderDijkstraDrawer(cy) {
    // Usage example:
    // highlightShortestPath('node-a', 'node-b'); // Replace with your source and target node IDs
    //- Function to get the default node style from cy-style.json
    //- weight: (edge) => 1, // You can adjust the weight function if needed
    //- weight: (edge) => edge.data('distance')
    // Usage example:
    // highlightShortestPath('node-a', 'node-b'); // Replace with your source and target node IDs
    //- Function to get the default node style from cy-style.json
    //- weight: (edge) => 1, // You can adjust the weight function if needed
    //- weight: (edge) => edge.data('distance')

    console.log("im triggered");

    // Remove existing highlight from all edges
    // Remove existing highlight from all edges
    cy.edges().forEach((edge) => {
        edge.removeClass("spf");
    });

    // Get the node sourceNodeId from pathFinderSourceNodeInput and targetNodeId from pathFinderTargetNodeInput
    // Get the node sourceNodeId from pathFinderSourceNodeInput and targetNodeId from pathFinderTargetNodeInput
    const sourceNodeId = document.getElementById(
        "panelBlock-viewportButtons-buttonfindRoute-divPanelBlock-columnContainerlabelFindRouteSource-panelContentlabelFindRouteSource-columnsPanelContentlabelFindRouteSource-labelColumnlabelFindRouteSource-inputColumnlabelFindRouteSource-labellabelFindRouteSource",
    ).value;
    const targetNodeId = document.getElementById(
        "panelBlock-viewportButtons-buttonfindRoute-divPanelBlock-columnContainerlabelFindRouteTarget-panelContentlabelFindRouteTarget-columnsPanelContentlabelFindRouteTarget-labelColumnlabelFindRouteTarget-inputColumnlabelFindRouteTarget-labellabelFindRouteTarget",
    ).value;

    // Assuming you have 'cy' as your Cytoscape instance
    // Assuming you have 'cy' as your Cytoscape instance
    const sourceNode = cy.$(`node[id="${sourceNodeId}"]`);
    const targetNode = cy.$(`node[id="${targetNodeId}"]`);

    console.log(
        "Info: " +
        "Let's find the path from-" +
        sourceNodeId +
        "-to-" +
        targetNodeId +
        "!",
    );
    appendMessage(
        "Info: " +
        "Let's find the path from-" +
        sourceNodeId +
        "-to-" +
        targetNodeId +
        "!",
    );

    // Check if both nodes exist
    // Check if both nodes exist
    if (sourceNode.length === 0 || targetNode.length === 0) {
        console.error(
            `Bro, couldn't find the source or target node you specified. Double-check the node names.`,
        );
        appendMessage(
            `Bro, couldn't find the source or target node you specified. Double-check the node names.`,
        );
        return;
    }

    // Get the Dijkstra result with the shortest path
    // Get the Dijkstra result with the shortest path
    const dijkstraResult = cy.elements().dijkstra({
        root: sourceNode,
        weight: (edge) => 1,
        // Use the custom weight attribute
        // weight: edge => edge.data('customWeight'),
        // Use the custom weight attribute
        // weight: edge => edge.data('customWeight'),
    });
    // Get the shortest path from Dijkstra result
    // Get the shortest path from Dijkstra result
    const shortestPathEdges = dijkstraResult.pathTo(targetNode);
    console.log(shortestPathEdges);

    // Check if there is a valid path (shortestPathEdges is not empty)
    // Check if there is a valid path (shortestPathEdges is not empty)
    if (shortestPathEdges.length > 1) {
        // Highlight the shortest path
        // Highlight the shortest path
        shortestPathEdges.forEach((edge) => {
            edge.addClass("spf");
        });

        //- Zoom out on the node
        //- Zoom out on the node
        cy.fit();

        //- Zoom in on the node
        //- Zoom in on the node
        cy.animate({
            zoom: {
                level: 5,
                position: {
                    x: sourceNode.position("x"),
                    y: sourceNode.position("y"),
                },
                renderedPosition: {
                    x: sourceNode.renderedPosition("x"),
                    y: sourceNode.renderedPosition("y"),
                },
            },
            duration: 1500,
        });
        // throw log
        // throw log
        console.log(
            "Info: " +
            "Yo, check it out! Shorthest Path from-" +
            sourceNodeId +
            "-to-" +
            targetNodeId +
            " has been found.",
        );
        appendMessage(
            "Info: " +
            "Yo, check it out! Shorthest Path from-" +
            sourceNodeId +
            "-to-" +
            targetNodeId +
            " has been found, below is the path trace..",
        );
        console.log(shortestPathEdges);

        shortestPathEdges.forEach((edge) => {
            console.log("Edge ID:", edge.id());
            console.log("Source Node ID:", edge.source().id());
            console.log("Target Node ID:", edge.target().id());

            edgeId = edge.id();
            sourceNodeId = edge.source().id();
            targetNodeId = edge.target().id();
            // You can access other properties of the edge, e.g., source, target, data, etc.
            // You can access other properties of the edge, e.g., source, target, data, etc.

            appendMessage("Info: " + "Edge ID: " + edgeId);
            appendMessage("Info: " + "Source Node ID: " + sourceNodeId);
            appendMessage("Info: " + "Target Node ID: " + targetNodeId);
        });
    } else {
        console.error(
            `Bro, there is no path from "${sourceNodeId}" to "${targetNodeId}".`,
        );
        appendMessage(
            `Bro, there is no path from "${sourceNodeId}" to "${targetNodeId}".`,
        );
        return;
    }
}

// sleep funtion
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function verticallAllignLayout(cy) {
    var verticalNodeGap = document.getElementById(
        "panelBlock-viewportButtons-buttonadjustLayout-divPanelBlock-columnContainerlabelAdjustLayoutAlignmentVerticalNodeGap-panelContentlabelAdjustLayoutAlignmentVerticalNodeGap-columnsPanelContentlabelAdjustLayoutAlignmentVerticalNodeGap-labelColumnlabelAdjustLayoutAlignmentVerticalNodeGap-inputColumnlabelAdjustLayoutAlignmentVerticalNodeGap-labellabelAdjustLayoutAlignmentVerticalNodeGap",
    ).value;
    var verticalGroupGap = document.getElementById(
        "panelBlock-viewportButtons-buttonadjustLayout-divPanelBlock-columnContainerlabelAdjustLayoutAlignmentVerticalGroupGap-panelContentlabelAdjustLayoutAlignmentVerticalGroupGap-columnsPanelContentlabelAdjustLayoutAlignmentVerticalGroupGap-labelColumnlabelAdjustLayoutAlignmentVerticalGroupGap-inputColumnlabelAdjustLayoutAlignmentVerticalGroupGap-labellabelAdjustLayoutAlignmentVerticalGroupGap",
    ).value;

    console.log("verticalNodeGap", verticalNodeGap);
    console.log("verticalGroupGap", verticalGroupGap);

    const xOffset = parseFloat(verticalNodeGap);
    const yOffset = parseFloat(verticalGroupGap);

    console.log("yOffset", yOffset);
    console.log("xOffset", xOffset);

    const delay = 100;

    setTimeout(() => {
        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                // For each parent node
                // For each parent node
                const children = node.children();
                const numRows = 1;

                const cellWidth = node.width() / children.length;
                // const xOffset = 5
                // const xOffset = 5

                children.forEach(function(child, index) {
                    // Position children in rows
                    // Position children in rows
                    const xPos = index * (cellWidth + xOffset);
                    const yPos = 0;

                    // Set the position of each child node
                    // Set the position of each child node
                    child.position({
                        x: xPos,
                        y: yPos
                    });
                });
            }
        });

        var parentCounts = {};
        var maxWidth = 0;
        var centerX = 0;
        var centerY = cy.height() / 2;

        // Count children of each parent node
        // Count children of each parent node
        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                const childrenCount = node.children().length;
                parentCounts[node.id()] = childrenCount;
            }
        });

        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                const width = node.width();
                if (width > maxWidth) {
                    maxWidth = width;
                    console.log("ParentMaxWidth: ", maxWidth);
                }
            }
        });

        const divisionFactor = maxWidth / 2;
        console.log("divisionFactor: ", divisionFactor);

        // Sort parent nodes by child count in ascending order
        // Sort parent nodes by child count in ascending order
        const sortedParents = Object.keys(parentCounts).sort(
            (a, b) => parentCounts[a] - parentCounts[b],
        );

        let yPos = 0;
        // const yOffset = 50;
        // const yOffset = 50;

        // Position parent nodes vertically and center them horizontally
        // Position parent nodes vertically and center them horizontally
        sortedParents.forEach(function(parentId) {
            const parent = cy.getElementById(parentId);
            const xPos = centerX - parent.width() / divisionFactor;
            // to the left compared to the center of the widest parent node.
            // to the left compared to the center of the widest parent node.
            parent.position({
                x: xPos,
                y: yPos
            });
            yPos += yOffset;
        });
        cy.fit();
    }, delay);
}

function horizontalAllignLayout(cy) {
    var horizontalNodeGap = document.getElementById(
        "panelBlock-viewportButtons-buttonadjustLayout-divPanelBlock-columnContainerlabelAdjustLayoutAlignmentHorizontalNodeGap-panelContentlabelAdjustLayoutAlignmentHorizontalNodeGap-columnsPanelContentlabelAdjustLayoutAlignmentHorizontalNodeGap-labelColumnlabelAdjustLayoutAlignmentHorizontalNodeGap-inputColumnlabelAdjustLayoutAlignmentHorizontalNodeGap-labellabelAdjustLayoutAlignmentHorizontalNodeGap",
    ).value;
    var horizontalGroupGap = document.getElementById(
        "panelBlock-viewportButtons-buttonadjustLayout-divPanelBlock-columnContainerlabelAdjustLayoutAlignmentHorizontalGroupGap-panelContentlabelAdjustLayoutAlignmentHorizontalGroupGap-columnsPanelContentlabelAdjustLayoutAlignmentHorizontalGroupGap-labelColumnlabelAdjustLayoutAlignmentHorizontalGroupGap-inputColumnlabelAdjustLayoutAlignmentHorizontalGroupGap-labellabelAdjustLayoutAlignmentHorizontalGroupGap",
    ).value;

    console.log("horizontalNodeGap", horizontalNodeGap);
    console.log("horizontalGroupGap", horizontalGroupGap);

    const yOffset = parseFloat(horizontalNodeGap);
    const xOffset = parseFloat(horizontalGroupGap);

    console.log("yOffset", yOffset);
    console.log("xOffset", xOffset);

    const delay = 100;
    setTimeout(() => {
        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                // For each parent node
                // For each parent node
                const children = node.children();
                const numColumns = 1;
                const cellHeight = node.height() / children.length;
                // const yOffset = 5;
                // const yOffset = 5;

                children.forEach(function(child, index) {
                    // Position children in columns
                    // Position children in columns
                    const xPos = 0;
                    const yPos = index * (cellHeight + yOffset);

                    // Set the position of each child node
                    // Set the position of each child node
                    child.position({
                        x: xPos,
                        y: yPos
                    });
                });
            }
        });

        var parentCounts = {};
        var maxHeight = 0;
        var centerX = cy.width() / 2;
        var centerY = cy.height() / 2;

        // Count children of each parent node
        // Count children of each parent node
        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                const childrenCount = node.children().length;
                parentCounts[node.id()] = childrenCount;
            }
        });

        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                const height = node.height();
                if (height > maxHeight) {
                    maxHeight = height;
                    console.log("ParentMaxHeight: ", maxHeight);
                }
            }
        });

        const divisionFactor = maxHeight / 2;
        console.log("divisionFactor: ", divisionFactor);

        // Sort parent nodes by child count in ascending order
        // Sort parent nodes by child count in ascending order
        const sortedParents = Object.keys(parentCounts).sort(
            (a, b) => parentCounts[a] - parentCounts[b],
        );

        let xPos = 0;
        // const xOffset = 50;
        // const xOffset = 50;

        // Position parent nodes horizontally and center them vertically
        // Position parent nodes horizontally and center them vertically
        sortedParents.forEach(function(parentId) {
            const parent = cy.getElementById(parentId);
            const yPos = centerY - parent.height() / divisionFactor;
            parent.position({
                x: xPos,
                y: yPos
            });
            xPos -= xOffset;
        });

        cy.fit();
    }, delay);
}

async function captureAndSaveViewportAsPng(cy) {
    // Find the canvas element for layer2-node
    // Find the canvas element for layer2-node
    const canvasElement = document.querySelector(
        '#cy canvas[data-id="layer2-node"]',
    );

    const zoomScaleFactor = 1;

    // Check if the canvas element exists and is an HTMLCanvasElement
    // Check if the canvas element exists and is an HTMLCanvasElement
    if (canvasElement instanceof HTMLCanvasElement) {
        // Calculate the new canvas dimensions based on the high resolution factor
        // Calculate the new canvas dimensions based on the high resolution factor
        const newWidth = canvasElement.width * zoomScaleFactor;
        const newHeight = canvasElement.height * zoomScaleFactor;

        // Create a new canvas element with the increased dimensions
        // Create a new canvas element with the increased dimensions
        const newCanvas = document.createElement("canvas");
        newCanvas.width = newWidth;
        newCanvas.height = newHeight;
        const newCanvasContext = newCanvas.getContext("2d");

        // Scale the canvas content to the new dimensions
        // Scale the canvas content to the new dimensions
        newCanvasContext.scale(zoomScaleFactor, zoomScaleFactor);

        // Fill the new canvas with a white background
        // Fill the new canvas with a white background
        newCanvasContext.fillStyle = "white";
        newCanvasContext.fillRect(0, 0, newWidth, newHeight);

        // Draw the original canvas content on the new canvas
        // Draw the original canvas content on the new canvas
        newCanvasContext.drawImage(canvasElement, 0, 0);

        // Convert the new canvas to a data URL with a white background
        // Convert the new canvas to a data URL with a white background
        const dataUrl = newCanvas.toDataURL("image/png");

        // Create an anchor element to trigger the download
        // Create an anchor element to trigger the download
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "cytoscape-viewport.png";

        bulmaToast.toast({
            message: `Brace yourselves for a quick snapshot, folks! 📸 Capturing the viewport in 3... 2... 1... 🚀💥`,
            type: "is-warning is-size-6 p-3",
            duration: 2000,
            position: "top-center",
            closeOnClick: true,
        });
        await sleep(2000);
        // Simulate a click to trigger the download
        // Simulate a click to trigger the download
        link.click();
    } else {
        console.error(
            "Canvas element for layer2-node is not found or is not a valid HTML canvas element.",
        );
    }
}

async function captureAndSaveViewportAsDrawIo(cy) {
    // Find the canvas element for layer2-node
    // Find the canvas element for layer2-node
    const canvasElement = document.querySelector(
        '#cy canvas[data-id="layer2-node"]',
    );
    const drawIoWidht = canvasElement.width / 10;
    const drawIoHeight = canvasElement.height / 10;
    const drawIoaAspectRatio = drawIoWidht / drawIoHeight;

    const mxGraphHeader = `<mxGraphModel dx="${drawIoWidht / 2}" dy="${drawIoHeight / 2}" grid="1" gridSize="1" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${drawIoWidht}" pageHeight="${drawIoHeight}" math="0" shadow="0">
                                                                                        <root>
                                                                                            <mxCell id="0" />
                                                                                            <mxCell id="1" parent="0" />`;

    const mxGraphFooter = `    					</root>
                                                                                            </mxGraphModel>`;

    const mxCells = [];

    // Iterate through nodes and edges
    // Function to create mxCell XML for nodes
    // Iterate through nodes and edges
    // Function to create mxCell XML for nodes
    function createMxCellForNode(node, imageURL) {
        if (node.isParent()) {
            return `	
                                                        <mxCell id="${node.id()}" value="${node.data("id")}" style="shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;image=undefined;imageBackground=#8F96AC;imageBorder=#F2F2F2;strokeWidth=2;perimeterSpacing=10;opacity=30;fontSize=4;spacingTop=-7;" parent="1" vertex="1">
                                                            <mxGeometry x="${node.position("x") - node.width() / 2}" y="${node.position("y") - node.height() / 2}" width="${node.width()}" height="${node.height()}" as="geometry" />
                                                        </mxCell>`;
        } else if (
            !node.data("id").includes("statusGreen") &&
            !node.data("id").includes("statusRed")
        ) {
            return `
                                                        <mxCell id="${node.id()}" value="${node.data("id")}" style="shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;image=${imageURL};fontSize=4;spacingTop=-7;" vertex="1" parent="1">
                                                            <mxGeometry x="${node.position("x") - node.width() / 2}" y="${node.position("y") - node.height() / 2}" width="${node.width()}" height="${node.height()}" as="geometry" />
                                                        </mxCell>`;
        }
    }

    cy.nodes().forEach(function(node) {
        let imageURL;
        switch (node.data("topoViewerRole")) {
            case "pe":
                imageURL = "http://149.204.21.68:8087/images/clab-pe-light-blue.png";
                break;
            case "controller":
                imageURL =
                    "http://149.204.21.68:8087/images/clab-controller-light-blue.png";
                break;
            case "pon":
                imageURL = "http://149.204.21.68:8087/images/clab-pon-dark-blue.png";
                break;
            case "dcgw":
                imageURL = "http://149.204.21.68:8087/images/clab-dcgw-dark-blue.png";
                break;
            case "leaf":
                imageURL = "http://149.204.21.68:8087/images/clab-leaf-light-blue.png";
                break;
            case "spine":
                imageURL = "http://149.204.21.68:8087/images/clab-spine-dark-blue.png";
                break;
            case "super-spine":
                imageURL = "http://149.204.21.68:8087/images/clab-spine-light-blue.png";
                break;
        }
        mxCells.push(createMxCellForNode(node, imageURL));
    });

    cy.edges().forEach(function(edge) {
        mxCells.push(`
                                                                <mxCell id="${edge.data("id")}" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;strokeWidth=1;strokeColor=#B1BCC8;opacity=60;" parent="1" source="${edge.data("source")}" target="${edge.data("target")}" edge="1">
                                                                    <mxGeometry width="50" height="50" relative="1" as="geometry" >
                                                                    </mxGeometry>
                                                                </mxCell>
                                                                <mxCell id="${edge.data("id")}-LabelSource" value="${edge.data("sourceEndpoint")}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=3;" parent="${edge.data("id")}" vertex="1" connectable="0">
                                                                    <mxGeometry x="-0.5" y="1" relative="0.5" as="geometry">
                                                                        <mxPoint x="1" y="1" as="sourcePoint" />
                                                                    </mxGeometry>
                                                                </mxCell>
                                                                <mxCell id="${edge.data("id")}-labelTarget" value="${edge.data("targetEndpoint")}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=3" parent="${edge.data("id")}" vertex="1" connectable="0">
                                                                    <mxGeometry x="0.5" y="1" relative="0.5" as="geometry">
                                                                        <mxPoint x="1" y="1" as="targetPoint" />
                                                                    </mxGeometry>
                                                                </mxCell>`);
    });

    // Combine all parts and create XML
    // Combine all parts and create XML
    const mxGraphXML = mxGraphHeader + mxCells.join("") + mxGraphFooter;

    // Create a Blob from the XML
    // Create a Blob from the XML
    const blob = new Blob([mxGraphXML], {
        type: "application/xml",
    });

    // Create a URL for the Blob
    // Create a URL for the Blob
    const url = window.URL.createObjectURL(blob);

    // Create a download link and trigger a click event
    // Create a download link and trigger a click event
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "filename.drawio";
    document.body.appendChild(a);

    bulmaToast.toast({
        message: `Brace yourselves for a quick snapshot, folks! 📸 Capturing the viewport in 3... 2... 1... 🚀💥`,
        type: "is-warning is-size-6 p-3",
        duration: 2000,
        position: "top-center",
        closeOnClick: true,
    });
    await sleep(2000);
    // Simulate a click to trigger the download
    // Simulate a click to trigger the download
    a.click();

    // Clean up by revoking the URL and removing the download link
    // Clean up by revoking the URL and removing the download link
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}