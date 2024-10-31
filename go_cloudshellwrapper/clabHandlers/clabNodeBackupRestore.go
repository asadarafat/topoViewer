// clabNodeBackupRestoree.go
package clabhandlers

import (
	"encoding/json"
	"net/http"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	log "github.com/sirupsen/logrus"
)

type BackupRestoreRouterInfo struct {
	RouterKind       string `json:"routerKind"`
	RouterID         string `json:"routerID"`
	RouterUserName   string `json:"routerUserName"`
	RouterPassword   string `json:"routerPassword"`
	ConfigNamePrefix string `json:"configNamePrefix"`
	BackupPath       string `json:"backupPath"`
	Action           string `json:"action"`
}

func ClabNodeBackupRestoreHandler(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology) {
	var returnData string

	// Parse the request body
	var requestData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Access the parameters
	param1DataString := (requestData["param1"]).(string)
	log.Infof("requestData-param1-param1DataString: %s", param1DataString)

	// Create an instance of the struct
	var backupRestoreRouterInfo BackupRestoreRouterInfo

	// Unmarshal the JSON string into the struct
	err := json.Unmarshal([]byte(param1DataString), &backupRestoreRouterInfo)
	if err != nil {
		log.Error("Error unmarshalling JSON:", err)
		log.Errorf("Failed to execute device operation: %v", err)
		return
	} else {
		returnData = "success"
	}

	deviceKind := backupRestoreRouterInfo.RouterKind
	ipAddress := backupRestoreRouterInfo.RouterID
	username := backupRestoreRouterInfo.RouterUserName
	password := backupRestoreRouterInfo.RouterPassword
	configName := backupRestoreRouterInfo.ConfigNamePrefix
	backupDirectory := backupRestoreRouterInfo.BackupPath
	action := backupRestoreRouterInfo.Action

	log.Infof("deviceKind: %s", deviceKind)
	log.Infof("ipAddress: %s", ipAddress)
	log.Infof("username: %s", username)
	log.Infof("password: %s", password)
	log.Infof("configPrefixName: %s", configName)
	log.Infof("configBackupDirectory: %s", backupDirectory)
	log.Infof("NodeBackupRestoreFunctionFlag: %s", action)

	cyTopo.NodeConfigBackupRestore(
		deviceKind,
		ipAddress,
		username,
		password,
		configName,
		backupDirectory,
		action,
	)

	// Create a response JSON object
	responseData := map[string]interface{}{
		"result":      "/node-backup-restore endpoint POST executed",
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
		log.Errorf("Failed to execute device operation: %v", err)
		return
	}
}
