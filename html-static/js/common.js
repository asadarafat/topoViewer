			// reusable commonn functions 

			async function callGoFunction(goFunctionName, arg01, arg02, arg03) {
				console.log(`callGoFunction Called with ${goFunctionName}`);
				console.log(`Parameter01: ${arg01}`);
				console.log(`Parameter02: ${arg02}`);

				const data = {
					param1: arg01,
					param2: arg02,
					param3: arg03 // Add param3 if needed
				};

				try {
					const response = await fetch(goFunctionName, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(data),
					});

					if (!response.ok) {
						throw new Error("Network response was not ok");
					}

					const responseData = await response.json();
					return responseData;
				} catch (error) {
					console.error("Error:", error);
					throw error;
				}
			}


			async function getEnvironments(event) {
				showLoadingSpinner();
				try {
					const environments = await sendRequestToEndpointGet("/get-environments");

					// Handle the response data
					if (environments && typeof environments === 'object' && Object.keys(environments).length > 0) {
						hideLoadingSpinner();
						console.log("Valid non-empty JSON response received:", environments);
						return environments
					
					} else {
						console.log("Empty or invalid JSON response received");
					}
				} catch (error) {
					hideLoadingSpinner();
					console.error("Error occurred:", error);
					// Handle errors as needed
				}
			}

			async function postPythonAction(event, commandList) {
				showLoadingSpinner();
				try {
					const pythonActionRespons = await sendRequestToEndpointPost("/python-action" ,commandList);

					// Handle the response data
					if (pythonActionRespons && typeof pythonActionRespons === 'object' && Object.keys(pythonActionRespons).length > 0) {
						hideLoadingSpinner();
						console.log("Valid non-empty JSON response received:", pythonActionRespons);
						return pythonActionRespons
					} else {
						console.log("Empty or invalid JSON response received");
					}
				} catch (error) {
					hideLoadingSpinner();
					console.error("Error occurred:", error);
					// Handle errors as needed
				}
			}

			// Function to find a cytoJson element from cytoTopologyJson from getEnvironments() by id and retrieve its attributes
			function findCytoElementById(jsonArray, id) {
				const cytoElement = jsonArray.find(obj => obj.data.id === id);
				if (cytoElement) {
					return  cytoElement;
				} else {
					return null; // Handle case where person with given name is not found
				}
			}

			// Function to find a cytoJson element from cytoTopologyJson from getEnvironments() by name and retrieve its attributes
			function findCytoElementByName(jsonArray, name) {
				const cytoElement = jsonArray.find(obj => obj.data.name === name);
				if (cytoElement) {
					return cytoElement;
				} else {
					return null; // Handle case where person with given name is not found
				}
			}

			// Function to find a cytoJson element from cytoTopologyJson from getEnvironments() by longname and retrieve its attributes
			function findCytoElementByLongname(jsonArray, longname) {
				const cytoElement = jsonArray.find(obj => obj.data && obj.data.extraData && obj.data.extraData.longname === longname);
				if (cytoElement) {
					return cytoElement;
				} else {
					return null; // Handle case where element with given longname is not found
				}
			}

		
			// argsList is list
			async function sendRequestToEndpointPost(endpointName, argsList = []) {
				console.log(`callGoFunction Called with ${endpointName}`);
				console.log(`Parameters:`, argsList);
			
				const data = {};
				argsList.forEach((arg, index) => {
					data[`param${index + 1}`] = arg;
				});
			
				try {
					const response = await fetch(endpointName, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(data),
					});
			
					if (!response.ok) {
						throw new Error("Network response was not ok");
					}
			
					const responseData = await response.json();
					return responseData;
				} catch (error) {
					console.error("Error:", error);
					throw error;
				}
			}
			async function sendRequestToEndpointGet(endpointName, argsList = []) {
				console.log(`callGoFunction Called with ${endpointName}`);
				console.log(`Parameters:`, argsList);
			
				// Construct the query string from argsList
				const params = new URLSearchParams();
				argsList.forEach((arg, index) => {
					params.append(`param${index + 1}`, arg);
				});
			
				try {
					const response = await fetch(endpointName, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					});

					console.log(response)
			
					if (!response.ok) {
						throw new Error("Network response was not ok");
					}
			
					const responseData = await response.json();
					return responseData;
				} catch (error) {
					console.error("Error:", error);
					throw error;
				}
			}

			async function sendRequestToEndpointGetV2(endpointName, argsList = []) {
				console.log(`callGoFunction Called with ${endpointName}`);
				console.log(`Parameters:`, argsList);
			
				// Construct the query string from argsList
				const params = new URLSearchParams();
				argsList.forEach((arg, index) => {
					params.append(`param${index + 1}`, arg);
				});
			
				const urlWithParams = `${endpointName}?${params.toString()}`;
			
				try {
					const response = await fetch(urlWithParams, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					});
			
			
					if (!response.ok) {
						throw new Error("Network response was not ok");
					}
			
					const responseData = await response.json();

					console.log(responseData);

					return responseData;
				} catch (error) {
					console.error("Error:", error);
					throw error;
				}
			}

			// Function to detect light or dark mode
			function detectColorScheme() {
				// Check if the browser supports the prefers-color-scheme media feature
				if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					// Dark mode is enabled
					return 'dark';
				} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
					// Light mode is enabled
					return 'light';
				} else {
					// No preference or the browser does not support this media feature
					return 'no-preference';
				}
			}

			function showLoadingSpinnerGlobal() {
				document.getElementById('loading-spinner-global')
					.style.display = 'block';
			}
			
			function hideLoadingSpinnerGlobal() {
				document.getElementById('loading-spinner-global')
					.style.display = 'none';
			}