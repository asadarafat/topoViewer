// Initialize a state variable to track the element's presence
var isPanel01Cy = false;
var nodeClicked = false;
var edgeClicked = false;

var cy

var globalSelectedNode
var globalSelectedEdge

var linkEndpointVisibility = true;
var nodeContainerStatusVisibility = false;


var globalShellUrl = "/js/cloudshell"

var labName
var deploymentType

document.addEventListener("DOMContentLoaded", async function() {

    detectColorScheme() 

    await changeTitle()


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
    const socketUptime = initializeWebSocket("/uptime", async (msgUptime) => {
        environments =  await getEnvironments();
        labName =  environments["clab-name"]
        deploymentType  =  environments["deploymentType"]

        console.log("initializeWebSocket - getEnvironments", environments)
        console.log("initializeWebSocket - labName", environments["clab-name"])
        
        const string01 = "Containerlab Topology: " + labName;
        const string02 = " ::: Uptime: " + msgUptime.data;

        const ClabSubtitle = document.getElementById("ClabSubtitle");
        const messageBody = string01 + string02;

        ClabSubtitle.innerText = messageBody;
        console.log(ClabSubtitle.innerText);
    });

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
            fetch("css/cy-style.json")
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
            fetch("css/cy-style-dark.json")
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
            topoViewerNode = cy.filter('node[name = "topoviewer"]');
            topoViewerNode.remove();
        })
        .catch((error) => {
            console.error("Error loading graph data:", error);
        });

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
    cy.on("click", "edge", async function(event) {

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
        const defaultEdgeColor = "#969799";
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

        document.getElementById("panel-link-endpoint-b-name").textContent = `${clickedEdge.data("target")}`
        document.getElementById("panel-link-endpoint-b-mac-address").textContent = `${clickedEdge.data("extraData").clabTargetMacAddress}`

    
        // setting default impairment endpoint-a values by getting the data from clab via /clab-link-impairment GET API
        clabSourceLinkArgsList = [`${clickedEdge.data("extraData").clabSourceLongName}`,`${clickedEdge.data("extraData").clabSourcePort}`]
        clabSourceLinkImpairmentClabData = await sendRequestToEndpointGetV2("/clab-link-impairment", clabSourceLinkArgsList)

        if (clabSourceLinkImpairmentClabData && typeof clabSourceLinkImpairmentClabData === 'object' && Object.keys(clabSourceLinkImpairmentClabData).length > 0) {
            hideLoadingSpinner();
            console.log("Valid non-empty JSON response received:", clabSourceLinkImpairmentClabData);
            console.log("Valid non-empty JSON response received: clabSourceLinkImpairmentClabData returnd data", clabSourceLinkImpairmentClabData["return data"]["delay"]);

            if (clabSourceLinkImpairmentClabData["return data"]["delay"] == "N/A") {
                document.getElementById("panel-link-endpoint-a-delay").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-a-delay").value = clabSourceLinkImpairmentClabData["return data"]["delay"].replace(/ms$/, '');
            }

            if (clabSourceLinkImpairmentClabData["return data"]["jitter"] == "N/A") {
                document.getElementById("panel-link-endpoint-a-jitter").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-a-jitter").value = clabSourceLinkImpairmentClabData["return data"]["jitter"].replace(/ms$/, '');
            }

            if (clabSourceLinkImpairmentClabData["return data"]["rate"] == "N/A") {
                document.getElementById("panel-link-endpoint-a-rate").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-a-rate").value = clabSourceLinkImpairmentClabData["return data"]["rate"]
            }

            if (clabSourceLinkImpairmentClabData["return data"]["packet_loss"] == "N/A") {
                document.getElementById("panel-link-endpoint-a-loss").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-a-loss").value = clabSourceLinkImpairmentClabData["return data"]["packet_loss"].replace(/%$/, '');
            }

        
        } else {
            console.log("Empty or invalid JSON response received");
        }




        // setting default impairment endpoint-b values by getting the data from clab via /clab-link-impairment GET API
        clabTargetLinkArgsList = [`${clickedEdge.data("extraData").clabTargetLongName}`,`${clickedEdge.data("extraData").clabTargetPort}`]
        clabTargetLinkImpairmentClabData = await sendRequestToEndpointGetV2("/clab-link-impairment", clabTargetLinkArgsList)
        
        if (clabTargetLinkImpairmentClabData && typeof clabTargetLinkImpairmentClabData === 'object' && Object.keys(clabTargetLinkImpairmentClabData).length > 0) {
            hideLoadingSpinner();
            console.log("Valid non-empty JSON response received:", clabTargetLinkImpairmentClabData);
            console.log("Valid non-empty JSON response received: clabTargetLinkImpairmentClabData returnd data", clabTargetLinkImpairmentClabData["return data"]["delay"]);

            if (clabTargetLinkImpairmentClabData["return data"]["delay"] == "N/A") {
                document.getElementById("panel-link-endpoint-b-delay").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-b-delay").value = clabTargetLinkImpairmentClabData["return data"]["delay"].replace(/ms$/, '');
            }

            if (clabTargetLinkImpairmentClabData["return data"]["jitter"] == "N/A") {
                document.getElementById("panel-link-endpoint-b-jitter").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-b-jitter").value = clabTargetLinkImpairmentClabData["return data"]["jitter"].replace(/ms$/, '');
            }

            if (clabTargetLinkImpairmentClabData["return data"]["rate"] == "N/A") {
                document.getElementById("panel-link-endpoint-b-rate").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-b-rate").value = clabTargetLinkImpairmentClabData["return data"]["rate"]
            }

            if (clabTargetLinkImpairmentClabData["return data"]["packet_loss"] == "N/A") {
                document.getElementById("panel-link-endpoint-b-loss").value = '0'
            }else {
                document.getElementById("panel-link-endpoint-b-loss").value = clabTargetLinkImpairmentClabData["return data"]["packet_loss"].replace(/%$/, '');
            }

        
        } else {
            console.log("Empty or invalid JSON response received");
        }




        // set selected edge-id to global variable
        globalSelectedEdge = clickedEdge.data("id")

        appendMessage(`"edgeClicked: " ${edgeClicked}`);
    });

 


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
                return;
            }

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
            if (nodeContainerStatusVisibility) {
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

async function initEnv() {
    environments =  await getEnvironments();
    labName = await environments["clab-name"]
    deploymentType  = await environments["deployment-type"]

    console.log("Lab-Name: ", labName)
    console.log("DeploymentType: ", deploymentType)
    return environments, labName
    }

async function changeTitle() {
    environments =  await getEnvironments();
    labName = await environments["clab-name"]

    console.log("changeTitle() - labName: ", labName)
    document.title = `TopoViewer::${labName}`;
}

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

            if (deploymentType == "container") {
                command = `ssh ${clabUser}@${clabServerAddress} /usr/bin/containerlab tools netem set -n ${clabTargetLongName} -i ${clabTargetPort} --delay ${delayValue}ms --jitter ${jitterValue}ms --rate ${rateValue} --loss ${lossValue}`
            } else if (deploymentType == "colocated") {
                command = `/usr/bin/containerlab tools netem set -n ${clabTargetLongName} -i ${clabTargetPort} --delay ${delayValue}ms --jitter ${jitterValue}ms --rate ${rateValue} --loss ${lossValue}`
            }

            console.log(`linkImpairment - deployment ${deploymentType}, command: ${command}`)
            var postPayload = []
            postPayload[0] = command
            await sendRequestToEndpointPost("/clab-link-impairment", postPayload)
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
                    <li><strong><a href="https://www.linkedin.com/in/sven-wisotzky-44788333/">Sven Wisotzky</a></strong> - For offering insightful feedback that led to significant full stack optimizations.</li>
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
        location.reload(true);

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
    var viewportDrawer = document.getElementsByClassName("viewport-drawer");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < viewportDrawer.length; i++) {
        viewportDrawer[i].style.display = "none";
    }
    
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
    var viewportDrawer = document.getElementsByClassName("viewport-drawer");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < viewportDrawer.length; i++) {
        viewportDrawer[i].style.display = "none";
    }

    console.log("viewportButtonsTopologyOverview clicked")
    viewportDrawerLayout = document.getElementById("viewport-drawer-topology-overview")
    viewportDrawerLayout.style.display = "block"

    viewportDrawerLayoutContent = document.getElementById("viewport-drawer-topology-overview-content")
    viewportDrawerLayoutContent.style.display = "block"
}

function viewportButtonsTopologyCapture() {
    var viewportDrawer = document.getElementsByClassName("viewport-drawer");
    // Loop through each element and set its display to 'none'
    for (var i = 0; i < viewportDrawer.length; i++) {
        viewportDrawer[i].style.display = "none";
    }

    console.log("viewportButtonsTopologyCapture clicked")

    viewportDrawerCapture = document.getElementById("viewport-drawer-capture-sceenshoot")
    viewportDrawerCapture.style.display = "block"

    viewportDrawerCaptureContent = document.getElementById("viewport-drawer-capture-sceenshoot-content")
    viewportDrawerCaptureContent.style.display = "block"
}

function viewportButtonsLabelEndpoint() {
    if (linkEndpointVisibility) {
        cy.edges().forEach(function(edge) {
            // edge.style("source-label", ".");
            // edge.style("target-label", ".");
            edge.style("text-opacity", 0);
            edge.style("text-background-opacity", 0);


            linkEndpointVisibility = false;
        });
    } else {
        cy.edges().forEach(function(edge) {
            edge.style("text-opacity", 1);
            edge.style("text-background-opacity", 0.7);
            linkEndpointVisibility = true;
        });
    }
}

function viewportButtonContainerStatusVisibility() {
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


function viewportDrawerLayoutForceDirected() {
    edgeLengthSlider = document.getElementById("force-directed-slider-link-lenght");
    nodeGapSlider = document.getElementById("force-directed-slider-node-gap");

    const edgeLengthValue = parseFloat(edgeLengthSlider.value);
    const nodeGapValue = parseFloat(nodeGapSlider.value);

    console.log("edgeLengthValue", edgeLengthValue);
    console.log("nodeGapValue", nodeGapValue);

    cy.layout(
        {
            fit: true,
            name: "cola",
            animate: true,
            randomize: false,
            maxSimulationTime: 400,
            edgeLength: function(e) {
                return edgeLengthValue / e.data("weight");
            },
            nodeGap: function(e) {
                return nodeGapValue / e.data("weight");
            },
        })
        .run();
}

function viewportDrawerLayoutVertical() {
    nodevGap = document.getElementById("vertical-layout-slider-node-v-gap");
    groupvGap = document.getElementById("vertical-layout-slider-group-v-gap");

    const nodevGapValue = parseFloat(nodevGap.value);
    const groupvGapValue = parseFloat(groupvGap.value);

    console.log("nodevGapValue", nodevGapValue);
    console.log("groupvGapValue", groupvGapValue);

    const xOffset = parseFloat(nodevGapValue);
    const yOffset = parseFloat(groupvGapValue);

    console.log("yOffset", yOffset);
    console.log("xOffset", xOffset);

    const delay = 100;

    setTimeout(() => {
        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                // For each parent node
                const children = node.children();
                const numRows = 1;

                const cellWidth = node.width() / children.length;
                // const xOffset = 5

                children.forEach(function(child, index) {
                    // Position children in rows
                    const xPos = index * (cellWidth + xOffset);
                    const yPos = 0;

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
        const sortedParents = Object.keys(parentCounts).sort(
            (a, b) => parentCounts[a] - parentCounts[b],
        );

        let yPos = 0;
        // const yOffset = 50;
        // const yOffset = 50;

        // Position parent nodes vertically and center them horizontally
        sortedParents.forEach(function(parentId) {
            const parent = cy.getElementById(parentId);
            const xPos = centerX - parent.width() / divisionFactor;
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

function viewportDrawerLayoutHorizontal() {
    nodehGap = document.getElementById("horizontal-layout-slider-node-h-gap");
    grouphGap = document.getElementById("horizontal-layout-slider-group-h-gap");

    const horizontalNodeGap = parseFloat(nodehGap.value);
    const horizontalGroupGap = parseFloat(grouphGap.value);

    console.log("nodevGapValue", horizontalNodeGap);
    console.log("groupvGapValue", horizontalGroupGap);

    const yOffset = parseFloat(horizontalNodeGap);
    const xOffset = parseFloat(horizontalGroupGap);

    console.log("yOffset", yOffset);
    console.log("xOffset", xOffset);

    const delay = 100;
    setTimeout(() => {
        cy.nodes().forEach(function(node) {
            if (node.isParent()) {
                // For each parent node
                const children = node.children();
                const numColumns = 1;
                const cellHeight = node.height() / children.length;
                // const yOffset = 5;

                children.forEach(function(child, index) {
                    // Position children in columns
                    const xPos = 0;
                    const yPos = index * (cellHeight + yOffset);

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
        const sortedParents = Object.keys(parentCounts).sort(
            (a, b) => parentCounts[a] - parentCounts[b],
        );

        let xPos = 0;
        // const xOffset = 50;

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


function viewportDrawerCaptureButton() {

    console.log ("viewportDrawerCaptureButton() - clicked")




        // Get all checkbox inputs within the specific div
        const checkboxes = document.querySelectorAll('#viewport-drawer-capture-sceenshoot-content .checkbox-input');
        
        // Initialize an array to store the values of checked checkboxes
        const selectedOptions = [];

        // Iterate through the NodeList of checkboxes
        checkboxes.forEach((checkbox) => {
            // If the checkbox is checked, push its value to the array
            if (checkbox.checked) {
                selectedOptions.push(checkbox.value);
            }
        });

        console.log ("viewportDrawerCaptureButton() - ", selectedOptions)


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
                imageURL = `http://${location.host}/images/clab-pe-light-blue.png`;
                break;
            case "controller":
                imageURL =
                    `http://${location.host}/images/clab-controller-light-blue.png`;
                break;
            case "pon":
                imageURL = `http://${location.host}/images/clab-pon-dark-blue.png`;
                break;
            case "dcgw":
                imageURL = `http://${location.host}/images/clab-dcgw-dark-blue.png`;
                break;
            case "leaf":
                imageURL = `http://${location.host}/images/clab-leaf-light-blue.png`;
                break;
            case "spine":
                imageURL = `http://${location.host}/images/clab-spine-dark-blue.png`;
                break;
            case "super-spine":
                imageURL = `http://${location.host}/images/clab-spine-light-blue.png`;
                break;
        }
        mxCells.push(createMxCellForNode(node, imageURL));
    });

    cy.edges().forEach(function(edge) {
        mxCells.push(`
            <mxCell id="${edge.data("id")}" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;strokeWidth=1;strokeColor=#969799;opacity=60;" parent="1" source="${edge.data("source")}" target="${edge.data("target")}" edge="1">
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
    const mxGraphXML = mxGraphHeader + mxCells.join("") + mxGraphFooter;

    // Create a Blob from the XML
    const blob = new Blob([mxGraphXML], {
        type: "application/xml",
    });

    // Create a URL for the Blob
    const url = window.URL.createObjectURL(blob);

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
    a.click();

    // Clean up by revoking the URL and removing the download link
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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



// aarafat-tag:
//// REFACTOR END

// logMessagesPanel manager
///-logMessagesPanel Function to append message function
function appendMessage(message) {
    // const textarea = document.getElementById('notificationTextarea');
    const textarea = document.getElementById("notificationTextarea");

    // Get the current date and time
    const timestamp = new Date().toLocaleString();

    textarea.value += `[${timestamp}] ${message}\n`;
    textarea.scrollTop = textarea.scrollHeight;
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