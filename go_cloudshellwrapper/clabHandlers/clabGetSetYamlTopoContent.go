// clabGetYamlTopoContent.go
package clabhandlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
)

// ClabSaveTopoCytoJsonHandler handles the save-cytoTopo endpoint without a specific cyto json file
// the handles will save the cytoTopoData based on the POST request of the frontEnd
func ClabSaveTopoCytoJsonHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, workingDirectory string) {
	var wrappedData map[string]interface{}

	// Parse JSON body to get the new element data
	err := json.NewDecoder(r.Body).Decode(&wrappedData)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Extract the element data from "param1"
	cytoTopoElementData, exists := wrappedData["param1"]
	if !exists {
		http.Error(w, "Expected 'param1' key in request payload", http.StatusBadRequest)
		return
	}

	// File path for dataCytoMarshall-addon.json
	// filePath := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoDataV2.Name+"/dataCytoMarshall-addon.json")

	// File path for dataCytoMarshall.json
	filePath := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoDataV2.Name+"/dataCytoMarshall.json")

	// Read existing data from the file, if it exists
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

	// Check if the element already exists and update if so
	elementExists := false
	for i, element := range existingData {
		if elementData, ok := element["data"].(map[string]interface{}); ok {
			if newElementData, ok := cytoTopoElementData.(map[string]interface{}); ok {
				if elementData["id"] == newElementData["data"].(map[string]interface{})["id"] {
					// Update existing element
					existingData[i] = cytoTopoElementData.(map[string]interface{})
					elementExists = true
					break
				}
			}
		}
	}

	// If the element does not exist, append it
	if !elementExists {
		existingData = append(existingData, cytoTopoElementData.(map[string]interface{}))
	}

	// Convert the updated data back to JSON for saving
	updatedJSON, err := json.MarshalIndent(existingData, "", "  ")
	if err != nil {
		http.Error(w, "Failed to encode updated data", http.StatusInternalServerError)
		return
	}

	// Write the updated JSON data to file
	err = os.WriteFile(filePath, updatedJSON, 0644)
	if err != nil {
		http.Error(w, "Failed to save updated data", http.StatusInternalServerError)
		return
	}

	// Respond with a success message
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Graph data saved successfully"}`))
}

// GetYamlTopoContent handles the /get-yaml-topo-content endpoint
// func GetYamlTopoContentHandler(w http.ResponseWriter, r *http.Request, yamlTopoFilePath string) {
// 	yamlData, err := os.ReadFile(yamlTopoFilePath)

func GetYamlTopoContentHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, workingDirectory string) {
	// yamlData, err := os.ReadFile(yamlTopoFilePath)

	// File path for clab-topo-yaml-addon.yaml
	filePath := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoDataV2.Name+"/clab-topo-yaml-addon.yaml")
	yamlData, err := os.ReadFile(filePath)

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

func ClabSaveTopoYamlHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, workingDirectory string) {
	var wrappedData map[string]interface{}

	// Parse JSON body to get the new element data
	err := json.NewDecoder(r.Body).Decode(&wrappedData)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Extract the element data from "param1"
	clabTopoYamlEditorData, exists := wrappedData["param1"]
	if !exists {
		http.Error(w, "Expected 'param1' key in request payload", http.StatusBadRequest)
		return
	}

	log.Infof("clabTopoYamlEditorData: %v", clabTopoYamlEditorData)

	// File path for clab-topo-yaml-addon.yaml
	filePath := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoDataV2.Name+"/clab-topo-yaml-addon.yaml")

	// Write the updated clab topo yaml data to file
	data, ok := clabTopoYamlEditorData.(string)
	if !ok {
		http.Error(w, "Invalid data format", http.StatusBadRequest)
		return
	}
	err = os.WriteFile(filePath, []byte(data), 0644)
	if err != nil {
		http.Error(w, "Failed to save updated data", http.StatusInternalServerError)
		return
	}

	// Respond with a success message
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Clab Topo yaml data saved successfully"}`))
}
