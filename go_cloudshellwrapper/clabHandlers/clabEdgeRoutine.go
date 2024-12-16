// clabNodeBackupRestoree.go
package clabhandlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	tools "github.com/asadarafat/topoViewer/go_tools"
	topoengine "github.com/asadarafat/topoViewer/go_topoengine"

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
	data, err := cyTopo.GetDockerConnectedInterfacesViaUnixSocket(queriesList[0], queriesList[1])
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
