			
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
				try {
					const environments = await sendRequestToEndpointGetV2("/get-environments");

					// Handle the response data
					if (environments && typeof environments === 'object' && Object.keys(environments).length > 0) {
						console.log("Valid non-empty JSON response received:", environments);
						return environments
					
					} else {
						console.log("Empty or invalid JSON response received");
					}
				} catch (error) {
					console.error("Error occurred:", error);
					// Handle errors as needed
				}
			}



			async function postPythonAction(event, commandList) {
				try {
					showLoadingSpinnerGlobal()
					const pythonActionRespons = await sendRequestToEndpointPost("/python-action" ,commandList);

					// Handle the response data
					if (pythonActionRespons && typeof pythonActionRespons === 'object' && Object.keys(pythonActionRespons).length > 0) {
						hideLoadingSpinnerGlobal();
						console.log("Valid non-empty JSON response received:", pythonActionRespons);
						return pythonActionRespons
					} else {
						console.log("Empty or invalid JSON response received");
					}
				} catch (error) {
					hideLoadingSpinnerGlobal();
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


			async function sendRequestToEndpointGetV3(endpointName, argsList = []) {
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
						throw new Error(`HTTP error! Status: ${response.status}`);
					}
			
					// Check if the response is JSON; otherwise, return as text
					const contentType = response.headers.get("Content-Type");
					let responseData;
			
					if (contentType && contentType.includes("application/json")) {
						responseData = await response.json();
					} else {
						responseData = await response.text(); // Return as-is for non-JSON content
					}
			
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
					applyTheme('dark');

					return 'dark';
				} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
					// Light mode is enabled
					applyTheme('light');

					return 'light';
				} else {
					// No preference or the browser does not support this media feature
					applyTheme('light');

					return 'no-preference';
				}
			}

			function applyTheme(theme) {
				document.getElementById('root').setAttribute(`data-theme`, `${theme}`);
				console.log(document.getElementById('root').getAttribute(`data-theme`))
			  }
			  

			function showLoadingSpinnerGlobal() {
				document.getElementById('loading-spinner-global')
					.style.display = 'block';
				document.getElementById('loading-spinner-global')
					.style.zIndex = '9999'; 
				document.getElementById('panel-backup-restore')
					.style.zIndex = '9998'; 
			}
			
			function hideLoadingSpinnerGlobal() {
				document.getElementById('loading-spinner-global')
					.style.display = 'none';
			}