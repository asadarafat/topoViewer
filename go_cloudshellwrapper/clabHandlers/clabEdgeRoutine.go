// clabNodeBackupRestoree.go
package clabhandlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	tools "github.com/asadarafat/topoViewer/go_tools"
	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	"github.com/gosnmp/gosnmp"

	log "github.com/sirupsen/logrus"
)

func ClabEdgeGetMacAddress(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology) {
	query := r.URL.Query()

	queriesList := make([]string, 0)
	for _, values := range query {
		queriesList = append(queriesList, values...)
	}

	log.Info("queriesList: ", queriesList)

	// Call the function to get Docker connected interfaces
	data, err := GetDockerConnectedInterfacesViaUnixSocket(queriesList[0], queriesList[1])
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(data)
	log.Infof("Docker Network Info: %s", data)
}

func ClabEdgeGetImpairment(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, clabUser string, clabPass string, clabHost string, clabServerAddress string) {
	log.Infof("<cmd-clab><I><clab-link-impairment(): GET method")

	// Parse query parameters
	query := r.URL.Query()
	queriesList := make([]string, 0)
	for _, values := range query {
		queriesList = append(queriesList, values...)
	}

	if len(queriesList) < 2 {
		http.Error(w, "Invalid query parameters", http.StatusBadRequest)
		log.Info("<cmd-clab><I><clab-link-impairment() - Insufficient query parameters")
		return
	}

	nodeId, interfaceId := queriesList[0], queriesList[1]
	// clabUser := confClab.GetString("clab-user")
	// clabPass := confClab.GetString("clab-pass")
	// clabHost := confClab.GetStringSlice("allowed-hostnames")[0]

	command := fmt.Sprintf("/usr/bin/containerlab tools netem show -n %s", nodeId)

	log.Infof("<cmd-clab><I><clab-link-impairment() - queriesList: %v", queriesList)
	log.Infof("<cmd-clab><I><clab-link-impairment() - nodeId: %s", nodeId)
	log.Infof("<cmd-clab><I><clab-link-impairment() - interfaceId: %s", interfaceId)
	log.Infof("<cmd-clab><I><clab-link-impairment() - command: %s", command)

	// Execute SSH command
	cliOutput, err := tools.SshSudo(clabHost, "22", clabUser, clabPass, clabServerAddress, command)
	if err != nil {
		log.Infof("<cmd-clab><I><clab-link-impairment() - Error executing SSH command: %v", err)
		http.Error(w, "Error executing SSH command", http.StatusInternalServerError)
		return
	}

	log.Infof("<cmd-clab><I><clab-link-impairment() - cliOutput: %s", cliOutput)

	// Check clab version
	clabVersion := "0.60"
	isHigher, err := cyTopo.IsClabVersionHigher(clabHost, "22", clabUser, clabPass, clabServerAddress, clabVersion)
	if err != nil {
		log.Infof("<cmd-clab><I><clab-link-impairment() - Error checking clab version: %v", err)
		http.Error(w, "Error checking clab version", http.StatusInternalServerError)
		return
	}

	log.Infof("<cmd-clab><I><clab-link-impairment() - Is version higher than %s? %v", clabVersion, isHigher)

	// Parse CLI output based on version
	var parseCliOutput interface{}
	if isHigher {
		log.Info("<cmd-clab><I><clab-link-impairment() - Version is higher than 0.60")
		parseCliOutput, err = cyTopo.ParseCLIOutputClab060(cliOutput, nodeId, interfaceId)
	} else {
		log.Info("<cmd-clab><I><clab-link-impairment() - Version is lower than or equal to 0.60")
		parseCliOutput, err = cyTopo.ParseCLIOutputClab(cliOutput, nodeId, interfaceId)
	}

	if err != nil {
		log.Infof("<cmd-clab><I><clab-link-impairment() - Error parsing CLI output: %v", err)
		http.Error(w, "Error parsing CLI output", http.StatusInternalServerError)
		return
	}

	log.Infof("<cmd-clab><I><clab-link-impairment() - ClabNetemInterfaceData: %v", parseCliOutput)

	// Respond with JSON
	responseData := map[string]interface{}{
		"result":      "clab-link-impairment endpoint GET executed",
		"return data": parseCliOutput,
		"error":       nil,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(responseData); err != nil {
		log.Infof("<cmd-clab><I><clab-link-impairment() - Error encoding JSON response: %v", err)
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
	}
}

func ClabEdgeSetImpairment(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, clabUser string, clabPass string, clabHost string, clabServerAddress string) {
	// Parse the request body
	var requestData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Access the parameters
	log.Info(requestData)

	// clabUser := confClab.GetString("clab-user")
	// clabHost := confClab.GetStringSlice("allowed-hostnames")
	// clabPass := confClab.GetString("clab-pass")
	command := requestData["param1"].(string)

	log.Info("command: ", command)

	returnData, err := tools.SshSudo(clabHost, "22", clabUser, clabPass, clabServerAddress, command)

	log.Info(returnData)

	// Create a response JSON object
	responseData := map[string]interface{}{
		"result":      "clab-link-impairment endpoint POST executed",
		"return data": returnData,
		"error":       err,
	}

	// Marshal the response JSON object into a JSON string
	jsonResponse, err := json.Marshal(responseData)
	if err != nil {
		http.Error(w, "Failed to marshal response data", http.StatusInternalServerError)
		return
	}

	// Set the response Content-Type header
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response to the client
	_, err = w.Write(jsonResponse)
	if err != nil {
		// Handle the error (e.g., log it)
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}

func ClabEdgeGetActualPortViaSnmp(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, workingDirectory string) {
	log.Infof("<go_cloudshellwrapper><E>getAllNodeEndpointDetail - Function is called")

	// Loading the dataCytoMarshall-{{clab-node-name}}.json
	dataCytoMarshallPath := path.Join(workingDirectory, fmt.Sprintf("./html-public/%s/dataCytoMarshall.json", cyTopo.ClabTopoDataV2.Name))

	log.Infof("################## %s", dataCytoMarshallPath)
	log.Infof("Loading dataCytoMarshall-%s.json from: '%s'", cyTopo.ClabTopoDataV2.Name, dataCytoMarshallPath)

	file, err := os.Open(dataCytoMarshallPath)
	if err != nil {
		log.Errorf("<go_cloudshellwrapper><E>getAllNodeEndpointDetail - Error opening dataCytoMarshall-{{clab-node-name}}.json %s>", err)
		return
	}
	defer file.Close()

	// Read the file contents
	byteValue, err := io.ReadAll(file)
	if err != nil {
		log.Errorf("<go_cloudshellwrapper><E>getAllNodeEndpointDetail - Error reading dataCytoMarshall-{{clab-node-name}}.json %s>", err)
		return
	}

	// load dataCytoMarshall-{{lab-name}}.json
	var cytoElements []topoengine.CytoJson
	err = json.Unmarshal(byteValue, &cytoElements)
	if err != nil {
		log.Errorf("<go_cloudshellwrapper><E>getAllNodeEndpointDetail - Error unmarshal dataCytoMarshall-{{clab-node-name}}.json %s>", err)
		return
	}

	// build list of nodes
	var nodeSrosList []string

	for _, cytoElementNode := range cytoElements {
		if cytoElementNode.Group == "nodes" {
			if extraData, ok := cytoElementNode.Data.ExtraData.(map[string]interface{}); ok {
				if kind, ok := extraData["kind"].(string); ok {

					// if kind, ok := extraData["kind"].(string); ok {
					if kind == "vr-sros" {
						nodeSrosList = append(nodeSrosList, extraData["longname"].(string))
					}
				}
			}
		}
	}
	log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - List of SROS node as input for snmp-walk: %s>", nodeSrosList)

	// build list of Node PortInfo map with snmpWalk
	nodesPortInfo := make(map[string][]topoengine.PortInfo)

	for _, nodeSros := range nodeSrosList {
		log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - Attempt snmpwalk to %s...>", nodeSros)

		_, sourceNodeSnmpWalkIfList, _ := cyTopo.SendSnmpGetNodeEndpoint(nodeSros, "public", gosnmp.Version2c)
		for key, interfaces := range sourceNodeSnmpWalkIfList { // combining map from sourceNodeSnmpWalkIfList
			nodesPortInfo[key] = append(nodesPortInfo[key], interfaces...)
		}
	}

	for i, cytoElement := range cytoElements {
		if cytoElement.Group == "edges" {

			log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - Edge id %s>", cytoElement.Data.ID)

			extraData := cytoElement.Data.ExtraData.(map[string]interface{})

			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - ########### Before snmpwalk ><###########>")
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - clabSourceLongName: %s>", extraData["clabSourceLongName"].(string))
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - sourceEndpoint: %s>", cytoElement.Data.SourceEndpoint)
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - clabTargetLongName: %s>", extraData["clabTargetLongName"].(string))
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - targetEndpoint: %s>", cytoElement.Data.TargetEndpoint)

			for _, nodeSros := range nodeSrosList {
				clabSourceLongName := extraData["clabSourceLongName"].(string)
				log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - clabSourceLongName: %s>", clabSourceLongName)

				if clabSourceLongName == nodeSros && len(nodesPortInfo[clabSourceLongName]) > 0 {
					if strings.HasPrefix(cytoElement.Data.SourceEndpoint, "eth") {
						SourceEndpointPortIndexStr := strings.TrimPrefix(cytoElement.Data.SourceEndpoint, "eth") /// if it is already snmp'ed then no eth
						SourceEndpointPortIndexInt, _ := strconv.Atoi(SourceEndpointPortIndexStr)
						cytoElement.Data.SourceEndpoint = nodesPortInfo[clabSourceLongName][SourceEndpointPortIndexInt-1].IfName

						log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - NEW cytoElement.Data.SourceEndpoint: %s>", cytoElement.Data.SourceEndpoint)

						cytoElements[i] = cytoElement
					}
				}

				clabTargetLongName := extraData["clabTargetLongName"].(string)
				log.Infof("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - clabTargetLongName: %s>", clabTargetLongName)

				if clabTargetLongName == nodeSros && len(nodesPortInfo[clabTargetLongName]) > 0 {
					if strings.HasPrefix(cytoElement.Data.TargetEndpoint, "eth") {

						TargetEndpointPortIndexStr := strings.TrimPrefix(cytoElement.Data.TargetEndpoint, "eth")
						TargetEndpointPortIndexInt, _ := strconv.Atoi(TargetEndpointPortIndexStr)
						cytoElement.Data.TargetEndpoint = nodesPortInfo[clabTargetLongName][TargetEndpointPortIndexInt-1].IfName

						log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - NEW cytoElement.Data.TargetEndpoint: %s>", cytoElement.Data.TargetEndpoint)

						cytoElements[i] = cytoElement

					}
				}
			}

			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - ########### After snmpwalk ><###########>")
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - clabSourceLongName: %s>", extraData["clabSourceLongName"].(string))
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - sourceEndpoint: %s>", cytoElement.Data.SourceEndpoint)
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - clabTargetLongName: %s>", extraData["clabTargetLongName"].(string))
			log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - targetEndpoint: %s>", cytoElement.Data.TargetEndpoint)

			log.Infof("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - cytoElement: %v>", cytoElement)

		}
	}

	jsonBytesCytoUiAfterSnmpwalk, err := json.MarshalIndent(cytoElements, "", "  ")
	if err != nil {
		log.Error(err)
		panic(err)
	}
	log.Infof("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - jsonBytesCytoUiAfterSnmpwalk Result: %v", string(jsonBytesCytoUiAfterSnmpwalk))
	cyTopo.PrintjsonBytesCytoUiV2(jsonBytesCytoUiAfterSnmpwalk)

	// w.Write([]byte(VersionInfo))          // send modifiedJSON as response to browser

	// w.Write([]byte("ok"))

	// w.WriteHeader(http.StatusOK)
	// w.Write(jsonBytesCytoUiAfterSnmpwalk) // send modifiedJSON as response to browser

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jsonBytesCytoUiAfterSnmpwalk)
}

// func ClabEdgeGetMacAddress(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology) {
// 	vars := mux.Vars(r)
// 	sourceContainer := vars["source_container"]
// 	targetContainer := vars["target_container"]

// 	log.Infof("Source Container: %s, Target Container: %s", sourceContainer, targetContainer)

// 	// Call the function to get Docker connected interfaces
// 	data, err := GetDockerConnectedInterfacesViaUnixSocket(sourceContainer, targetContainer)
// 	if err != nil {
// 		log.Errorf("Error retrieving connected interfaces: %v", err)
// 		http.Error(w, "Failed to retrieve connected interfaces", http.StatusInternalServerError)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusOK)
// 	w.Write(data)
// 	log.Infof("Docker Network Info: %s", data)
// }

// func ClabEdgeGetImpairment(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, clabUser string, clabPass string, clabHost string, clabServerAddress string) {
// 	vars := mux.Vars(r)
// 	nodeId := vars["nodeId"]
// 	interfaceId := vars["interfaceId"]

// 	// `/clab/link/${targetNodeId}/${targetNodePortId}/impairment`

// 	log.Infof("Source Container: %s, Target Container: %s", nodeId, interfaceId)

// 	// // Parse query parameters
// 	// query := r.URL.Query()
// 	// queriesList := make([]string, 0)
// 	// for _, values := range query {
// 	// 	queriesList = append(queriesList, values...)
// 	// }

// 	// if len(queriesList) < 2 {
// 	// 	http.Error(w, "Invalid query parameters", http.StatusBadRequest)
// 	// 	log.Info("<cmd-clab><I><clab-link-impairment() - Insufficient query parameters")
// 	// 	return
// 	// }

// 	// nodeId, interfaceId := queriesList[0], queriesList[1]

// 	// clabUser := confClab.GetString("clab-user")
// 	// clabPass := confClab.GetString("clab-pass")
// 	// clabHost := confClab.GetStringSlice("allowed-hostnames")[0]

// 	command := fmt.Sprintf("/usr/bin/containerlab tools netem show -n %s", nodeId)

// 	// log.Infof("<cmd-clab><I><clab-link-impairment() - queriesList: %v", queriesList)
// 	// log.Infof("<cmd-clab><I><clab-link-impairment() - nodeId: %s", nodeId)
// 	// log.Infof("<cmd-clab><I><clab-link-impairment() - interfaceId: %s", interfaceId)
// 	// log.Infof("<cmd-clab><I><clab-link-impairment() - command: %s", command)

// 	// Execute SSH command
// 	cliOutput, err := tools.SshSudo(clabHost, "22", clabUser, clabPass, clabServerAddress, command)
// 	if err != nil {
// 		log.Infof("<cmd-clab><I><clab-link-impairment() - Error executing SSH command: %v", err)
// 		http.Error(w, "Error executing SSH command", http.StatusInternalServerError)
// 		return
// 	}

// 	log.Infof("<cmd-clab><I><clab-link-impairment() - cliOutput: %s", cliOutput)

// 	// Check clab version
// 	clabVersion := "0.60"
// 	isHigher, err := cyTopo.IsClabVersionHigher(clabHost, "22", clabUser, clabPass, clabServerAddress, clabVersion)
// 	if err != nil {
// 		log.Infof("<cmd-clab><I><clab-link-impairment() - Error checking clab version: %v", err)
// 		http.Error(w, "Error checking clab version", http.StatusInternalServerError)
// 		return
// 	}

// 	log.Infof("<cmd-clab><I><clab-link-impairment() - Is version higher than %s? %v", clabVersion, isHigher)

// 	// Parse CLI output based on version
// 	var parseCliOutput interface{}
// 	if isHigher {
// 		log.Info("<cmd-clab><I><clab-link-impairment() - Version is higher than 0.60")
// 		parseCliOutput, err = cyTopo.ParseCLIOutputClab060(cliOutput, nodeId, interfaceId)
// 	} else {
// 		log.Info("<cmd-clab><I><clab-link-impairment() - Version is lower than or equal to 0.60")
// 		parseCliOutput, err = cyTopo.ParseCLIOutputClab(cliOutput, nodeId, interfaceId)
// 	}

// 	if err != nil {
// 		log.Infof("<cmd-clab><I><clab-link-impairment() - Error parsing CLI output: %v", err)
// 		http.Error(w, "Error parsing CLI output", http.StatusInternalServerError)
// 		return
// 	}

// 	log.Infof("<cmd-clab><I><clab-link-impairment() - ClabNetemInterfaceData: %v", parseCliOutput)

// 	// Respond with JSON
// 	responseData := map[string]interface{}{
// 		"result":      "clab-link-impairment endpoint GET executed",
// 		"return data": parseCliOutput,
// 		"error":       nil,
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	if err := json.NewEncoder(w).Encode(responseData); err != nil {
// 		log.Infof("<cmd-clab><I><clab-link-impairment() - Error encoding JSON response: %v", err)
// 		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
// 	}
// }
