// clabGetEnvironment.go
package clabhandlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
	"github.com/usvc/go-config"
)

// Environments holds environment configuration details
type Environments struct {
	EnvWorkingDirectory     string `json:"working-directory"`
	EnvClabName             string `json:"clab-name"`
	EnvClabServerAddress    string `json:"clab-server-address"`
	EnvAllowedHostname      string `json:"clab-allowed-hostname"`
	EnvAllowedHostname01    string `json:"clab-allowed-hostname01"`
	EnvClabServerPort       string `json:"clab-server-port"`
	EnvDeploymentType       string `json:"deployment-type"`
	EnvTopoViewerVersion    string `json:"topoviewer-version"`
	EnvCyTopoJsonBytes      []topoengine.CytoJson
	EnvCyTopoJsonBytesAddon []map[string]interface{}
}

// GetEnvironmentsHandler handles the /get-environments endpoint
func GetEnvironmentsHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, confClab config.Map, cyTopoJsonBytes []byte, VersionInfo string, workingDirectory string) {
	var cytoTopoJson []topoengine.CytoJson
	err := json.Unmarshal(cyTopoJsonBytes, &cytoTopoJson)
	if err != nil {
		log.Error("Error parsing JSON:", err)
		http.Error(w, "Error parsing JSON", http.StatusInternalServerError)
		return
	}

	// File path for dataCytoMarshall.json
	filePath := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoDataV2.Name+"/dataCytoMarshall.json")

	// Read existing data from the file, if it exists, existing data could contain the addon data
	var existingData []map[string]interface{}
	fileContent, err := os.ReadFile(filePath)
	if err == nil {
		// Parse existing JSON data
		err = json.Unmarshal(fileContent, &existingData)
		if err != nil {
			http.Error(w, "Failed to parse existing data", http.StatusInternalServerError)
			return
		}
	} else {
		// Initialize empty data if the file doesn't exist
		existingData = []map[string]interface{}{}
	}

	var hostname01 string

	allowedHostnames := confClab.GetStringSlice("allowed-hostnames")
	if len(allowedHostnames) == 1 {
		hostname01 = "127.0.0.1"
	} else if len(allowedHostnames) > 1 {
		hostname01 = allowedHostnames[1]
	} else {
		// Handle case where there are no allowed hostnames or log an error
		hostname01 = "default-hostname" // or handle as needed
	}

	environments := Environments{
		EnvWorkingDirectory:     confClab.GetString("workdir"),
		EnvClabName:             cyTopo.ClabTopoDataV2.Name,
		EnvClabServerAddress:    confClab.GetString("clab-server-address"),
		EnvAllowedHostname:      confClab.GetStringSlice("allowed-hostnames")[0],
		EnvAllowedHostname01:    hostname01,
		EnvClabServerPort:       fmt.Sprintf("%d", confClab.GetInt("server-port")),
		EnvDeploymentType:       confClab.GetString("deployment-type"),
		EnvTopoViewerVersion:    VersionInfo,
		EnvCyTopoJsonBytes:      cytoTopoJson,
		EnvCyTopoJsonBytesAddon: existingData,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(environments)
	if err != nil {
		log.Error("Failed to write response:", err)
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}
