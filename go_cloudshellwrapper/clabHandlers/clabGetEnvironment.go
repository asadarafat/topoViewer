// clabGetEnvironment.go
package clabhandlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
	"github.com/usvc/go-config"
)

// Environments holds environment configuration details
type Environments struct {
	EnvWorkingDirectory  string `json:"working-directory"`
	EnvClabName          string `json:"clab-name"`
	EnvClabServerAddress string `json:"clab-server-address"`
	EnvClabServerPort    string `json:"clab-server-port"`
	EnvDeploymentType    string `json:"deployment-type"`
	EnvTopoViewerVersion string `json:"topoviewer-version"`
	EnvCyTopoJsonBytes   []topoengine.CytoJson
}

// GetEnvironmentsHandler handles the /get-environments endpoint
func GetEnvironmentsHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, confClab config.Map, cyTopoJsonBytes []byte, VersionInfo string) {
	var cytoTopoJson []topoengine.CytoJson
	err := json.Unmarshal(cyTopoJsonBytes, &cytoTopoJson)
	if err != nil {
		log.Error("Error parsing JSON:", err)
		http.Error(w, "Error parsing JSON", http.StatusInternalServerError)
		return
	}

	environments := Environments{
		EnvWorkingDirectory:  confClab.GetString("workdir"),
		EnvClabName:          cyTopo.ClabTopoDataV2.Name,
		EnvClabServerAddress: confClab.GetStringSlice("allowed-hostnames")[0],
		EnvClabServerPort:    fmt.Sprintf("%d", confClab.GetInt("server-port")),
		EnvDeploymentType:    confClab.GetString("deployment-type"),
		EnvTopoViewerVersion: VersionInfo,
		EnvCyTopoJsonBytes:   cytoTopoJson,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(environments)
	if err != nil {
		log.Error("Failed to write response:", err)
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}
