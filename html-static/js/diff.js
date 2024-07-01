

var files = [];
var OriginalModelFileName;

var routerName
var RouterID

async function backupRestoreNodeConfig(event) {
	// init environments parameters
	environments = await getEnvironments(event);
	console.log("linkImpairment - environments: ", environments)
	nodeData = findCytoElementByLongname(environments["EnvCyTopoJsonBytes"], globalSelectedNode)

	routerName = globalSelectedNode;
	routerID = nodeData["data"]["extraData"]["mgmtIpv4Addresss"]

	console.log("backupRestoreNodeConfig - routerName: ", routerName)
    console.log("backupRestoreNodeConfig - routerID: ", routerID)

	// Remove all Overlayed Panel
	// Get all elements with the class "panel-overlay"
	var panelOverlays = document.getElementsByClassName("panel-overlay");
	// Loop through each element and set its display to 'none'
	for (var i = 0; i < panelOverlays.length; i++) {
		panelOverlays[i].style.display = "none";
	}

    try {

        document.getElementById("panel-backup-restore").style.display = "block";
        document.getElementById("panel-backup-restore").style.height = "calc(85vh - 50px)";
        document.getElementById("editor-container").style.height = "calc(80vh - 80px)";

		// Output the values to console
		console.log('routerID:', routerID);
		console.log('routerName:', routerName);

		// Update the text of the file browser title
		const fileBrowserTitle = document.getElementById('diff-panel-title');
		if (fileBrowserTitle && routerID) {
			fileBrowserTitle.textContent = `${routerName}`;
		}
		if (routerName) {
			loadFileList(routerName);
		} else {
			console.error('No routerName specified in URL');
		}

		const searchInput = document.getElementById('search-input');
		searchInput.addEventListener('input', (event) => {
			const filter = event.target.value.toLowerCase();
			filterFileList(filter);
		
	});

	// Add event listener to the buttonRestoreConfig
	// Add event listener to the buttonRestoreConfig
	const buttonRestoreConfig = document.getElementById('buttonRestoreConfig');
	buttonRestoreConfig.addEventListener('click', async (event) => {
		event.preventDefault(); // Prevent default form submission if inside a form
		var configName = OriginalModelFileName;

		// Output the values to console
		console.log('############################################################');
		console.log('routerID:', routerID);
		console.log('routerName:', routerName);
		console.log("OriginalModelFileName: ", OriginalModelFileName)
		console.log("configName: ", configName)

		const arg01 = routerID; // Replace with actual arguments as needed
		const arg02 = routerName; // Replace with actual arguments as needed
		const arg03 = 'restore'; // Replace with actual arguments as needed

		try {
			environments = await getEnvironments(event);
			console.log("buttonRestoreConfig - environments: ", environments)

			cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
			routerData = findCytoElementByLongname(cytoTopologyJson, routerName)

			workingDirectory = environments["working-directory"]
			actionName = "backupRestoreScript"
			routerUserName = "admin"
			routerPassword = "admin"
			routerKind = routerData["data"]["extraData"]["kind"]

			console.log("buttonRestoreConfig - routerData - longName: ", routerData)

			command = (`python3 ${workingDirectory}/html-static/actions/${actionName}/${actionName}.py --ip_address ${routerID} --username ${routerUserName} --password ${routerPassword} --configname ${configName} --kind ${routerKind} --directory ${workingDirectory}/html-public/nokia-ServiceProvider/node-backup/${routerName}/ --log_directory ${workingDirectory}/logs --restore`)
			console.log(command)

			const postPythonActionArgs = [routerName, command]
			await postPythonAction(event, postPythonActionArgs)
			loadFileList(routerName)


		} catch (error) {
			console.error('Error executing restore configuration:', error);
		}
	});

	// Add event listener to the buttonBackupConfig
	// Add event listener to the buttonBackupConfig
	const buttonBackupConfig = document.getElementById('buttonBackupConfig');
	buttonBackupConfig.addEventListener('click', async (event) => {
		event.preventDefault(); // Prevent default form submission if inside a form
		var configName = OriginalModelFileName;

		// Output the values to console
		console.log('############################################################');
		console.log('routerID:', routerID);
		console.log('routerName:', routerName);
		console.log("OriginalModelFileName: ", OriginalModelFileName)

		const arg01 = routerID; // Replace with actual arguments as needed
		const arg02 = routerName; // Replace with actual arguments as needed
		const arg03 = 'backup'; // Replace with actual arguments as needed

		try {
			// await buttonBackupConfigExec(event, arg01, arg02, arg03);
			environments = await getEnvironments(event);
			console.log("buttonLoadRunningConfig - environments: ", environments)

			cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
			routerData = findCytoElementByLongname(cytoTopologyJson, routerName)

			workingDirectory = environments["working-directory"]
			actionName = "backupRestoreScript"
			routerUserName = "admin"
			routerPassword = "admin"
			routerKind = routerData["data"]["extraData"]["kind"]

			console.log("buttonBackupConfig - routerData - longName: ", routerData)

			command = (`python3 ${workingDirectory}/html-static/actions/${actionName}/${actionName}.py --ip_address ${routerID} --username ${routerUserName} --password ${routerPassword} --configname ${routerName} --kind ${routerKind} --directory ${workingDirectory}/html-public/nokia-ServiceProvider/node-backup/${routerName}/ --log_directory ${workingDirectory}/logs --backup`)
			console.log(command)

			const postPythonActionArgs = [routerName, command]
			await postPythonAction(event, postPythonActionArgs)
			loadFileList(routerName)


		} catch (error) {
			console.error('Error executing backup configuration:', error);
		}
	});

	// Add event listener to the buttonLoadRunningConfig
	// Add event listener to the buttonLoadRunningConfig
	const buttonLoadRunningConfig = document.getElementById('buttonLoadRunningConfig');
	buttonLoadRunningConfig.addEventListener('click', async (event) => {
		event.preventDefault(); // Prevent default form submission if inside a form
		var configName = OriginalModelFileName;

		// Output the values to console
		console.log('############################################################');
		console.log('routerID:', routerID);
		console.log('routerName:', routerName);

		const arg01 = routerID; // Replace with actual arguments as needed
		const arg02 = routerName; // Replace with actual arguments as needed
		const arg03 = 'get'; // Replace with actual arguments as needed

		try {
			environments = await getEnvironments(event);
			console.log("buttonLoadRunningConfig - environments: ", environments)

			cytoTopologyJson = environments["EnvCyTopoJsonBytes"]
			routerData = findCytoElementByLongname(cytoTopologyJson, routerName)
			console.log("routerDatarouterDatarouterDatarouterDatarouterData", routerData)

			workingDirectory = environments["working-directory"]
			actionName = "backupRestoreScript"
			routerUserName = "admin"
			routerPassword = "admin"
			routerKind = routerData["data"]["extraData"]["kind"]

			console.log("buttonLoadRunningConfig - routerData - longName: ", routerData)

			command = (`python3 ${workingDirectory}/html-static/actions/${actionName}/${actionName}.py --ip_address ${routerID} --username ${routerUserName} --password ${routerPassword} --configname ${routerName} --kind ${routerKind} --directory ${workingDirectory}/html-public/nokia-ServiceProvider/node-backup/${routerName}/ --log_directory ${workingDirectory}/logs --get`)
			console.log(command)

			const postPythonActionArgs = [routerName, command]
			await postPythonAction(event, postPythonActionArgs)
			loadFileList(routerName)
			loadFileContentModified(`${routerName}-running.cfg`)

		} catch (error) {
			console.error('Error executing load running configuration:', error);
		}
	});

    } catch (error) {
        console.error('Error executing restore configuration:', error);
    }
}


function loadFileList(routerName) {
	fetch(`/files?RouterName=${encodeURIComponent(routerName)}`)
		.then(response => response.json())
		.then(data => {
			if (!data || !data.files || data.files.length === 0) {
				console.warn('No backup files found for this router.');
				// Handle empty response here, e.g., show a message to the user
				renderFileList([]);
			} else {
				const files = data.files;
				console.log(files)
				renderFileList(files);
			}
		})
		.catch(error => console.error('Error fetching file list:', error));
}

function renderFileList(fileList) {
	const panel = document.getElementById('panel-file-browser');
	const searchBox = panel.firstElementChild;
	const searchInput = document.getElementById('search-input');
	const searchValue = searchInput.value;

	panel.innerHTML = '';
	panel.appendChild(searchBox);

	fileList.forEach(file => {
		const fileElement = document.createElement('a');
		fileElement.classList.add('panel-block');
		fileElement.innerHTML = `
			      <span class="panel-icon">
			        <i class="fas fa-book" aria-hidden="true"></i>
			      </span>
			      ${file}
			    `;
		fileElement.addEventListener('click', () => loadFileContentOriginal(file));
		panel.appendChild(fileElement);
	});

	searchInput.value = searchValue;
	searchInput.focus();
}

function filterFileList(filter) {
	const filteredFiles = files.filter(file => file.toLowerCase()
		.includes(filter));
	renderFileList(filteredFiles);
}

function showLoadingSpinner() {
	document.getElementById('loading-spinner')
		.style.display = 'block';
}

function hideLoadingSpinner() {
	document.getElementById('loading-spinner')
		.style.display = 'none';
}

function loadFileContentOriginal(fileName) {
	showLoadingSpinner();

	// set Global Var
	OriginalModelFileName = fileName;
	console.log("OriginalModelFileName", OriginalModelFileName)

	// Get the current URL
	const currentUrl = new URL(window.location.href);

	// Get query parameters using URLSearchParams
	const params = new URLSearchParams(currentUrl.search);

	// Output the values to console
	console.log('routerID:', routerID);
	console.log('routerName:', routerName);

	fetch(`/file?RouterName=${encodeURIComponent(routerName)}&name=${encodeURIComponent(fileName)}`)
		.then(response => response.json())
		.then(data => {
			hideLoadingSpinner();

			if (data.success) {
				const originalModel = monaco.editor.createModel(data.content, 'text/plain');
				diffEditor.setModel({
					original: originalModel,
					modified: diffEditor.getModel()
						.modified
				});
			} else {
				console.error('Error loading file content:', data.message);
			}
		})
		.catch(error => {
			hideLoadingSpinner();
			console.error('Error fetching file content:', error);
		});
}

function loadFileContentModified(fileName) {
	showLoadingSpinner();

	// set Global Var
	OriginalModelFileName = fileName;
	console.log("OriginalModelFileName", OriginalModelFileName)

	// Get the current URL
	const currentUrl = new URL(window.location.href);

	// Get query parameters using URLSearchParams
	const params = new URLSearchParams(currentUrl.search);

	// Output the values to console
	console.log('routerID:', routerID);
	console.log('routerName:', routerName);

	fetch(`/file?RouterName=${encodeURIComponent(routerName)}&name=${encodeURIComponent(fileName)}`)
		.then(response => response.json())
		.then(data => {
			hideLoadingSpinner();

			if (data.success) {
				const modifiedModel = monaco.editor.createModel(data.content, 'text/plain');
				diffEditor.setModel({
					original: diffEditor.getModel()
						.original,
					modified: modifiedModel
				});
			} else {
				console.error('Error loading file content:', data.message);
			}
		})
		.catch(error => {
			hideLoadingSpinner();
			console.error('Error fetching file content:', error);
		});
}


require.config({
	paths: {
		'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs'
	}
});
require(['vs/editor/editor.main'], function() {
	const originalModel = monaco.editor.createModel('<!DOCTYPE html>\n<html>\n	<head>\n  		<title>My Saved Config</title>\n	</head>\n	<body>\n		<h1>Hello, World!</h1>\n	</body>\n</html>', 'html');
	const modifiedModel = monaco.editor.createModel('<!DOCTYPE html>\n<html>\n	<head>\n  		<title>My Running Config</title>\n	</head>\n	<body>\n		<h1>Hello, Universe!</h1>\n	</body>\n</html>', 'html');

	window.diffEditor = monaco.editor.createDiffEditor(document.getElementById('editor-container'), {
		theme: 'vs-dark',
		originalEditable: true,
		readOnly: false,
		smoothScrolling: false,
		fontFamily: "menlo",
		fontSize: 11,
		fontLigatures: true,
		enableSplitViewResizing: true,
		automaticLayout: true,
		splitViewDefaultRatio: 0.52,
	});

	diffEditor.setModel({
		original: originalModel,
		modified: modifiedModel
	});

	window.addEventListener('resize', () => {
		diffEditor.layout();
	});

	diffEditor.layout();
});