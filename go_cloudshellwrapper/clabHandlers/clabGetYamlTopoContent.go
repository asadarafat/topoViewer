// clabGetYamlTopoContent.go
package clabhandlers

import (
	"net/http"
	"os"

	log "github.com/sirupsen/logrus"
)

// GetYamlTopoContent handles the /get-yaml-topo-content endpoint
func GetYamlTopoContent(w http.ResponseWriter, r *http.Request, yamlTopoFilePath string) {
	yamlData, err := os.ReadFile(yamlTopoFilePath)
	if err != nil {
		log.Error("Error reading YAML file:", err)
		http.Error(w, "Error reading YAML file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/x-yaml")
	_, err = w.Write(yamlData)
	if err != nil {
		log.Error("Failed to write response:", err)
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}
