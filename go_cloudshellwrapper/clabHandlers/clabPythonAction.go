// clabPythonAction.go
package clabhandlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"

	tools "github.com/asadarafat/topoViewer/go_tools"
	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
	"github.com/usvc/go-config"
)

// PythonActionHandler handles the /python-action endpoint
func PythonActionHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, HtmlPublicPrefixPath string, confClab config.Map) {
	// Parse the request body
	var requestData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		log.Error(err)
	}

	// Access the parameters
	log.Info(requestData)

	clabUser := confClab.GetString("clab-user")
	clabHost := confClab.GetStringSlice("allowed-hostnames")
	clabPass := confClab.GetString("clab-pass")
	RouterId := requestData["param1"].(string)
	command := requestData["param2"].(string)

	backupDir := fmt.Sprintf(HtmlPublicPrefixPath + cyTopo.ClabTopoDataV2.Name + "/node-backup/" + RouterId)
	err := os.Mkdir(backupDir, 0755)
	if err != nil {
		log.Error(err)
	}

	chownCmd := exec.Command("chown", fmt.Sprintf("%s:%s", clabUser, clabUser), backupDir)
	err = chownCmd.Run()
	if err != nil {
		log.Error(err)
	}

	returnData, err := tools.Ssh(clabHost[0], "22", clabUser, clabPass, command)

	// Create a response JSON object
	responseData := map[string]interface{}{
		"result":      "python-action endpoint executed",
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
