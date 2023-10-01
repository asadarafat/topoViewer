			// initiate websocket for uptime
			var protocolUptime = "ws://";
			var urlUptime = protocolUptime + location.host + "/uptime"
			var websocketMessage
			
			let socketUptime = new WebSocket(urlUptime);
			console.log("Attempting Connection...");
			
			socketUptime.onopen = () => {
			    console.log("Successfully Connected WebSocket for uptime");
			    if (socketUptime.readyState === WebSocket.OPEN) {
			        socketUptime.send("Hi From the WebSocketClient-Uptime!");
			    }
			};
			socketUptime.onclose = event => {
			    console.log("Socket Closed Connection: ", event);
			    socketUptime.send("Client Closed!")
			};
			
			socketUptime.onerror = error => {
			    console.log("Socket Error: ", error);
			};
			
			// retrieve websocket message
			socketUptime.onmessage = (msgUptime) => {
			    console.log(msgUptime.data)
			    var tt1 = "Containerlab Topology: Komodo2-" + 'dummy-string';
			    var tt2 = " ::: Uptime: " + msgUptime.data;
			
			    let ClabSubtitle = document.getElementById("ClabSubtitle");
			
			    var tmessageBody = tt1 + tt2
			    ClabSubtitle.innerText = tmessageBody
			    console.log(ClabSubtitle.innerText)
			}
			
			// initiate websocket for DockerNodeStatus
			var nodeDockerStatusVisibility = false;
			var protocolDockerNodeStatus = "ws://";
			var urlDockerNodeStatus = protocolDockerNodeStatus + location.host + "/dockerNodeStatus"
			var websocketMessage
			
			let socketDockerNodeStatus = new WebSocket(urlDockerNodeStatus);
			console.log("Attempting Connection...");
			
			socketDockerNodeStatus.onopen = () => {
			    console.log("Successfully Connected WebSocket for DockerNodeStatus");
			    if (socketDockerNodeStatus.readyState === WebSocket.OPEN) {
			        socketDockerNodeStatus.send("Hi From the WebSocketClient-DockerNodeStatus!");
			    }
			};
			socketDockerNodeStatus.onclose = event => {
			    console.log("Socket Closed Connection: ", event);
			    socketDockerNodeStatus.send("Client Closed!")
			};
			
			socketDockerNodeStatus.onerror = error => {
			    console.log("SocketDockerNodeStatus Error: ", error);
			};
			
			// retrieve websocket message
			socketDockerNodeStatus.onmessage = (msgDockerNodeStatus) => {
			    //console.log(msgDockerNodeStatus.data)
			
			    try {
			        // Parse the JSON data
			        // Extract the desired fields
			        const Names = JSON.parse(msgDockerNodeStatus.data).Names;
			        const Status = JSON.parse(msgDockerNodeStatus.data).Status;
			
			        // console.log(`Names: ${Names}, Status: ${Status}`);
			        SetNodeDockerStatus(Names, Status)
			
			    } catch (error) {
			        console.error("Error parsing JSON:", error);
			    }
			
			}
			
			// initiate websocket for clabServerAddress
			var protocolclabServerAddress = "ws://";
			var urlclabServerAddress = protocolclabServerAddress + location.host + "/clabServerAddress"
			var websocketMessage
			
			let socketclabServerAddress = new WebSocket(urlclabServerAddress);
			console.log("Attempting Connection...");
			
			socketclabServerAddress.onopen = () => {
			    console.log("Successfully Connected WebSocket for clabServerAddress");
			    if (socketclabServerAddress.readyState === WebSocket.OPEN) {
			        socketclabServerAddress.send("Hi From the WebSocketClient-clabServerAddress!");
			    }
			};
			socketclabServerAddress.onclose = event => {
			    console.log("Socket Closed Connection: ", event);
			    socketclabServerAddress.send("Client Closed!")
			};
			
			socketclabServerAddress.onerror = error => {
			    console.log("Socket Error: ", error);
			};
			
			// retrieve websocket message
			socketclabServerAddress.onmessage = (msgclabServerAddress) => {
			    console.log(msgclabServerAddress.data)
			    document.title = "TopoViewer ::: "+msgclabServerAddress.data;
			}