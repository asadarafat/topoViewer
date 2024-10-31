// clabNodeBackupRestoreLoadFileContent.go
package clabhandlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path"
	"path/filepath"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
)

type FileContentResponse struct {
	Success bool   `json:"success"`
	Content string `json:"content,omitempty"`
	Message string `json:"message,omitempty"`
}

// FileHandler handles the /file endpoint
func FileHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, HtmlPublicPrefixPath string) {
	fileName := r.URL.Query().Get("name")
	if fileName == "" {
		http.Error(w, "Missing file name", http.StatusBadRequest)
		return
	}

	// Define the directory to list files from
	RouterName := r.URL.Query().Get("RouterName")
	if RouterName == "" {
		http.Error(w, "Missing RouterName parameter", http.StatusBadRequest)
		return
	}

	workingDirectory, _ := os.Getwd()
	routerBackupDirectory := path.Join(workingDirectory, HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/node-backup/"+RouterName)

	log.Infof("routerBackupDirectory: %s", routerBackupDirectory)

	filePath := filepath.Join(routerBackupDirectory, fileName)
	log.Infof("routerBackupDirectoryFilepath: %s", filePath)

	content, err := os.ReadFile(filePath)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(FileContentResponse{
			Success: false,
			Message: "Failed to read file",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FileContentResponse{
		Success: true,
		Content: string(content),
	})
}
