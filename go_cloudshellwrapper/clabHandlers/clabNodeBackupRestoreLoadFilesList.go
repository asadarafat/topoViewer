// clabNodeBackupRestoreLoadFileContent.go
package clabhandlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
)

type FileListResponse struct {
	Files []string `json:"files"`
}

// FilesHandler handles the /files endpoint
func FilesHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, HtmlPublicPrefixPath string) {
	// Get the RouterName from query parameters
	RouterName := r.URL.Query().Get("RouterName")
	if RouterName == "" {
		http.Error(w, "Missing RouterName parameter", http.StatusBadRequest)
		return
	}

	workingDirectory, _ := os.Getwd()
	routerBackupDirectory := path.Join(workingDirectory, HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/node-backup/"+RouterName)

	// Create the directory if it doesn't exist
	err := os.MkdirAll(routerBackupDirectory, 0755)
	if err != nil {
		http.Error(w, "Failed to create backup directory", http.StatusInternalServerError)
		return
	}

	log.Infof("routerBackupDirectory: %s", routerBackupDirectory)

	// Read the directory
	files, err := os.ReadDir(routerBackupDirectory)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Collect file names
	var fileNames []string
	for _, file := range files {
		if !file.IsDir() {
			fileNames = append(fileNames, file.Name())
		}
	}

	// Create the response
	response := FileListResponse{Files: fileNames}

	// Write the response as JSON
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Error("Failed to write response:", err)
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}
