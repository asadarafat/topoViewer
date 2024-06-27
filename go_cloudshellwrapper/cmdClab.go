package cloudshellwrapper

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	xtermjs "github.com/asadarafat/topoViewer/go_xtermjs"
	"github.com/gosnmp/gosnmp"
	"github.com/usvc/go-config"

	tools "github.com/asadarafat/topoViewer/go_tools"
	cp "github.com/otiai10/copy"
	log "github.com/sirupsen/logrus"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/cobra"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/mem"
)

type IndexHtmlStruct struct {
	LabName        string
	DeploymentType string
}

type UsageData struct {
	CPU        float64          `json:"cpu"`
	Memory     float64          `json:"memory"`
	Containers []ContainerUsage `json:"containers"`
}

type ContainerUsage struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	CPU    float64 `json:"cpu"`
	Memory float64 `json:"memory"`
}

type FileListResponse struct {
	Files []string `json:"files"`
}

type FileContentResponse struct {
	Success bool   `json:"success"`
	Content string `json:"content,omitempty"`
	Message string `json:"message,omitempty"`
}

// config
var confClab = config.Map{
	"allowed-hostnames": &config.StringSlice{
		Default:   []string{"localhost"},
		Usage:     "comma-delimited list of hostnames that are allowed to connect to the websocket",
		Shorthand: "H",
	},
	"arguments": &config.StringSlice{
		Default:   []string{},
		Usage:     "comma-delimited list of arguments that should be passed to the terminal command",
		Shorthand: "r",
	},
	"command": &config.String{
		Default:   "/bin/bash",
		Usage:     "absolute path to command to run",
		Shorthand: "c",
	},
	"connection-error-limit": &config.Int{
		Default:   10,
		Usage:     "number of times a connection should be re-attempted before it's considered dead",
		Shorthand: "l",
	},
	"keepalive-ping-timeout": &config.Int{
		Default:   20,
		Usage:     "maximum duration in seconds between a ping message and its response to tolerate",
		Shorthand: "k",
	},
	"max-buffer-size-bytes": &config.Int{
		Default:   512,
		Usage:     "maximum length of input from terminal",
		Shorthand: "B",
	},
	"log-format": &config.String{
		Default: "text",
		Usage:   fmt.Sprintf("defines the format of the logs - one of ['%s']", strings.Join(tools.ValidFormatStrings, "', '")),
	},
	"log-level": &config.String{
		Default: "info",
		Usage:   fmt.Sprintf("defines the minimum level of logs to show - one of ['%s']", strings.Join(tools.ValidLevelStrings, "', '")),
	},
	"path-liveness": &config.String{
		Default: "/healthz",
		Usage:   "url path to the liveness probe endpoint",
	},
	"path-metrics": &config.String{
		Default: "/metrics",
		Usage:   "url path to the prometheus metrics endpoint",
	},
	"path-readiness": &config.String{
		Default: "/readyz",
		Usage:   "url path to the readiness probe endpoint",
	},
	"path-xtermjs": &config.String{
		Default: "/xterm.js",
		Usage:   "url path to the endpoint that xterm.js should attach to",
	},
	"server-addr": &config.String{
		Default:   "0.0.0.0",
		Usage:     "ip interface the server should listen on",
		Shorthand: "a",
	},
	"server-port": &config.Int{
		Default:   8080,
		Usage:     "port the server should listen on",
		Shorthand: "P",
	},
	"workdir": &config.String{
		Default:   ".",
		Usage:     "working directory",
		Shorthand: "w",
	},
	"topology-file": &config.String{
		Default:   ".",
		Usage:     "path to containerlab topo file",
		Shorthand: "t",
	},
	"topology-file-json": &config.String{
		Default:   ".",
		Usage:     "path to containerlab topo file",
		Shorthand: "j",
	},
	"clab-user": &config.String{
		Default:   "root",
		Usage:     "containerLab server host user",
		Shorthand: "u",
	},
	"clab-pass": &config.String{
		Default:   "root",
		Usage:     "containerLab server host password",
		Shorthand: "p",
	},
	"deployment-type": &config.String{
		Default: "container",
		Usage:   "TopoViewertype of deployment. The option are 'container' if the TopoViewer will be running under container or 'colocated' if TopoViewer will be running co-located with containerlab server",
	},
}

// var rootCommand = cobra.Command{
var clabCommand = cobra.Command{
	Use:     "clab",
	Short:   "Creates a web-based topology view from Container Lab topology file",
	Version: VersionInfo,
	RunE:    Clab,
}

// var websocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  2048,
	WriteBufferSize: 2048,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

var StartTime = time.Now()
var connections = make(map[*websocket.Conn]bool)
var connectionsMu sync.Mutex

func init() {
	// initialise the logger config clabCommand
	confClab.ApplyToCobra(&clabCommand)
	// init clabCommand
	rootCommand.AddCommand(&clabCommand)
}

// define a reader which will listen for
// new messages being sent to our WebSocket
// endpoint
// func reader(conn *websocket.Conn) {
// 	defer conn.Close()

// 	// Set the maximum allowed idle time for the WebSocket connection
// 	conn.SetReadDeadline(time.Now().Add(5 * time.Second)) // Adjust the duration as needed

// 	for {
// 		// read in a message
// 		messageType, p, err := conn.ReadMessage()
// 		if err != nil {
// 			// Check for specific close error codes indicating client-initiated closure
// 			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
// 				log.Info("WebSocket connection closed by the client.")
// 			} else {
// 				log.Info("Error while reading from WebSocket:", err)
// 			}
// 			return
// 		}
// 		// print out that message for clarity
// 		log.Info(string(p))

// 		if err := conn.WriteMessage(messageType, p); err != nil {
// 			log.Info(err)
// 			return
// 		}
// 		conn.SetReadDeadline(time.Now().Add(5 * time.Second))
// 	}
// }

func checkSudoAccess() {
	euid := syscall.Geteuid()

	if euid == 0 {
		log.Infof("Yo, this app is running with sudo access (as root).")

	} else {
		log.Infof("This app ain't got no sudo powers, bro.")
		os.Exit(1)

	}
}

func Clab(_ *cobra.Command, _ []string) error {

	cyTopo := topoengine.CytoTopology{}
	toolLogger := tools.Logs{}

	cyTopo.InitLogger()
	cyTopo.LogLevel = uint32(toolLogger.MapLogLevelStringToNumber(confClab.GetString("log-level")))
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)

	//check sudo
	checkSudoAccess()

	// Test gNMIc Capabilities
	// SendGnmicToNodeCapabilities("srl", "10.2.1.121", "admin", "NokiaSrl1!", true, false)
	// SendGnmicToNodeCapabilities("sros", "10.2.1.101", "admin", "admin", true, true)

	// Test gNMIc Get
	// SendGnmicToNodeGet("srl", "10.2.1.121", "admin", "NokiaSrl1!", true, false, "/system/name")
	// SendGnmicToNodeGet("sros", "10.2.1.101", "admin", "admin", true, true, "/system/name")

	// initialise the cloudshellLogger
	// tools.InitCloudShellLog(tools.Format(confClab.GetString("log-format")), tools.Level(confClab.GetString("log-level")))

	// tranform clab-topo-file into cytoscape-model
	// aarafat-tag: check if provided topo in json or yaml

	topoClab := confClab.GetString("topology-file-json")

	//// Clab Version 2
	//log.Debug("topo Clab: ", topoClab)
	log.Debug("Code Trace Point ####")

	// topoFile := cyTopo.ClabTopoRead(topoClab) // loading containerLab export-topo json file

	clabHostUsername := confClab.GetString("clab-user")

	command := confClab.GetString("command")
	arguments := confClab.GetStringSlice("arguments")
	connectionErrorLimit := confClab.GetInt("connection-error-limit")
	allowedHostnames := confClab.GetStringSlice("allowed-hostnames")
	keepalivePingTimeout := time.Duration(confClab.GetInt("keepalive-ping-timeout")) * time.Second
	maxBufferSizeBytes := confClab.GetInt("max-buffer-size-bytes")
	pathLiveness := confClab.GetString("path-liveness")
	pathMetrics := confClab.GetString("path-metrics")
	pathReadiness := confClab.GetString("path-readiness")
	pathXTermJS := confClab.GetString("path-xtermjs")
	serverAddress := confClab.GetString("server-addr")
	serverPort := confClab.GetInt("server-port")
	workingDirectory := confClab.GetString("workdir")
	if !path.IsAbs(workingDirectory) {
		wd, err := os.Getwd()
		if err != nil {
			message := fmt.Sprintf("failed to get working directory: %s", err)
			log.Error(message)
			return errors.New(message)
		}
		workingDirectory = path.Join(wd, workingDirectory)
	}
	deploymentType := confClab.GetString("deployment-type")

	// log.Infof("topology file path    : '%s'", workingDirectory+"/"+topoClab)
	log.Infof("====== Start up Parameter ======")
	log.Infof("")
	log.Infof("TopoViewer Version		: '%s'", VersionInfo)
	log.Infof("topology file			: '%s'", (topoClab))
	log.Infof("depyloyment type			: %s", (deploymentType))
	log.Infof("working directory		: '%s'", workingDirectory)
	log.Infof("command					: '%s'", command)
	log.Infof("arguments				: ['%s']", strings.Join(arguments, "', '"))
	log.Infof("allowed hosts			: ['%s']", strings.Join(allowedHostnames, "', '"))
	log.Infof("connection error limit	: %v", connectionErrorLimit)
	log.Infof("keepalive ping timeout	: %v", keepalivePingTimeout)
	log.Infof("max buffer size			: %v bytes", maxBufferSizeBytes)
	log.Infof("server address			: '%s' ", serverAddress)
	log.Infof("server port				: %v", serverPort)
	log.Infof("liveness checks path		: '%s'", pathLiveness)
	log.Infof("readiness checks path	: '%s'", pathReadiness)
	log.Infof("metrics endpoint path	: '%s'", pathMetrics)
	log.Infof("xtermjs endpoint path	: '%s'", pathXTermJS)
	log.Infof("====== Start up Parameter ======")
	log.Infof("")

	// configure routing
	router := mux.NewRouter()

	topoFile := cyTopo.ClabTopoRead(topoClab) // loading containerLab export-topo json file
	// topoFile := cyTopo.ClabTopoRead(path.Join("", topoClab)) // loading containerLab export-topo json file

	var initNodeEndpointDetailSourceTarget []byte

	cyTopoJsonBytes := cyTopo.UnmarshalContainerLabTopoV2(topoFile, clabHostUsername, initNodeEndpointDetailSourceTarget)
	// printing dataCytoMarshall-{{clab-node-name}}.json
	cyTopo.PrintjsonBytesCytoUiV2(cyTopoJsonBytes)

	// this is the endpoint for xterm.js to connect to
	xtermjsHandlerOptions := xtermjs.HandlerOpts{
		AllowedHostnames: allowedHostnames,
		// Arguments:            arguments,
		Command:              command,
		ConnectionErrorLimit: connectionErrorLimit,
		CreateLogger: func(connectionUUID string, r *http.Request) xtermjs.Logger {
			createRequestLog(r, map[string]interface{}{"connection_uuid": connectionUUID}).Infof("created logger for connection '%s'", connectionUUID)
			return createRequestLog(nil, map[string]interface{}{"connection_uuid": connectionUUID})
		},
		KeepalivePingTimeout: keepalivePingTimeout,
		MaxBufferSizeBytes:   maxBufferSizeBytes,
	}
	router.HandleFunc(pathXTermJS, xtermjs.GetHandler(xtermjsHandlerOptions, "TEST"))

	// readiness probe endpoint
	router.HandleFunc(pathReadiness,
		func(w http.ResponseWriter, r *http.Request) {
			// w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		})

	// liveness probe endpoint
	router.HandleFunc(pathLiveness,
		func(w http.ResponseWriter, r *http.Request) {
			// w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		})

	// metrics endpoint
	router.Handle(pathMetrics, promhttp.Handler())

	// version endpoint
	router.HandleFunc("/version",
		func(w http.ResponseWriter, r *http.Request) {
			// w.WriteHeader(http.StatusOK)
			w.Write([]byte(VersionInfo))
			log.Infof("VersionInfo: %s", VersionInfo)

		})

	// cloudshell endpoint
	router.HandleFunc("/cloudshell}",
		func(w http.ResponseWriter, r *http.Request) {
			log.Info(xtermjsHandlerOptions)
			// w.WriteHeader(http.StatusOK)
			w.Write([]byte(VersionInfo))

			params := mux.Vars(r)
			RouterId := params["id"]
			log.Infof("RouterId: %s ", RouterId)
		})

	// cloudshell-tools endpoint
	router.HandleFunc("/cloudshell-tools}",
		func(w http.ResponseWriter, r *http.Request) {
			log.Infof("cloudshell-tools endpoint called, xtermjsHandlerOptions is : %v", xtermjsHandlerOptions)
			// w.WriteHeader(http.StatusOK)
			w.Write([]byte(VersionInfo))

		})

	// getNodeEndpointDetail endpoint
	router.HandleFunc("/getNodeEndpointDetail",
		func(w http.ResponseWriter, r *http.Request) {

			// Parse the request body
			var requestData map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			// Access the parameters
			arg01 := requestData["param1"].(string)
			arg02 := requestData["param2"].(string)

			log.Infof("getNodeEndpointDetail endpoint called")

			log.Infof("getNodeEndpointDetail-Param1: %s", arg01)
			log.Infof("getNodeEndpointDetail-Param2: %s", arg02)

			w.WriteHeader(http.StatusOK)

			log.Infof("getNodeEndpointDetai called")
			log.Info("Interface SNMP Walk id triggered")

			nodeEndpointDetailSource, _, _ := cyTopo.SendSnmpGetNodeEndpoint(arg01, "public", gosnmp.Version2c)
			// w.Write(nodeEndpointDetailSource)

			nodeEndpointDetailTarget, _, _ := cyTopo.SendSnmpGetNodeEndpoint(arg02, "public", gosnmp.Version2c)
			// w.Write(nodeEndpointDetailTarget)

			var x []map[string]interface{}
			var y []map[string]interface{}

			// Unmarshal JSON into slices of maps
			if err := json.Unmarshal(nodeEndpointDetailSource, &x); err != nil {
				panic(err)
			}
			if err := json.Unmarshal(nodeEndpointDetailTarget, &y); err != nil {
				panic(err)
			}

			// Create a new slice to contain the combined arrays
			combined := [][]map[string]interface{}{{}, {}}
			combined[0] = append(combined[0], x...)
			combined[1] = append(combined[1], y...)

			// Marshal combined slice into JSON bytes
			combinedJSON, err := json.MarshalIndent(combined, "", " ")
			if err != nil {
				panic(err)
			}

			// Print the combined JSON
			fmt.Println(string(combinedJSON))

			// If you want to convert combinedJSON to bytes
			combinedBytes := combinedJSON
			// fmt.Printf("Combined JSON in bytes: %s\n", combinedBytes)

			// log.Infof("nodeEndpointDetailSource: %s", nodeEndpointDetailSource)
			// log.Infof("nodeEndpointDetailTarget: %s", nodeEndpointDetailTarget)
			log.Infof("combinedSlice: %s", combinedBytes)

			w.Write(combinedBytes)

			nodeEndpointDetailSourceTarget := combinedBytes

			jsonBtytesNodeEndpoint := cyTopo.UnmarshalContainerLabTopoV2(topoFile, clabHostUsername, nodeEndpointDetailSourceTarget)
			cyTopo.PrintjsonBytesCytoUiV2(jsonBtytesNodeEndpoint) // write new dataCytoMarshall-{{clab-node-name}}.json

			log.Infof("jsonBtytesNodeEndpoint: %s", jsonBtytesNodeEndpoint)
			log.Infof("len of nodeEndpointDetailSourceTarget is %d ", len(nodeEndpointDetailSourceTarget))

		})
	// getAllNodeEndpointDetail endpoint
	router.HandleFunc("/getAllNodeEndpointDetail",
		func(w http.ResponseWriter, r *http.Request) {

			// Parse the request body
			var requestData map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				log.Infof("Error execute getAllNodeEndpointDetail endpoint")
				return
			}

			// Access the parameters
			// Ensure we can read requestData["param1"].(string) and log an error if not
			arg01, ok1 := requestData["param1"].(string)
			if !ok1 {
				log.Errorf("<go_cloudshellwrapper><E>getAllNodeEndpointDetail - cannot access param1 of POST API to getAllNodeEndpointDetail endpoint>")
			}

			// Assertion - ensure we can read requestData["param2"].(string) and log an error if not
			arg02, ok2 := requestData["param2"].(string)
			if !ok2 {
				log.Errorf("<go_cloudshellwrapper><E>getAllNodeEndpointDetail - cannot access param2 of POST API to getAllNodeEndpointDetail endpoint>")
			}

			log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - endpoint called>")
			log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - Param1: %s>", arg01)
			log.Infof("<go_cloudshellwrapper><I>getAllNodeEndpointDetail - Param1: %s>", arg02)

			// log.Infof("getAllNodeEndpointDetail-Param3: %s", arg03)

			// Loading the dataCytoMarshall-{{clab-node-name}}.json
			dataCytoMarshallPath := path.Join(workingDirectory, fmt.Sprintf("./html-public/%s/dataCytoMarshall-%s.json", cyTopo.ClabTopoDataV2.Name, cyTopo.ClabTopoDataV2.Name))
			log.Infof("Loading dataCytoMarshall-'%s'.json from: '%s'", cyTopo.ClabTopoDataV2.Name, dataCytoMarshallPath)

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
						if longname, ok := extraData["longname"].(string); ok {

							// if kind, ok := extraData["kind"].(string); ok {
							if longname == "vr-sros" {
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

			// sampleNodePortInfoString := "clab-nokia-ServiceProvider-R07-PE-ASBR"
			// if len(nodesPortInfo[sampleNodePortInfoString]) > 0 {
			// 	nodesPortInfoJSON, err := json.MarshalIndent(nodesPortInfo[sampleNodePortInfoString][0], "", "  ")
			// 	if err != nil {
			// 		log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - Error pretty printing JSON:: %s>", err)
			// 		return
			// 	}
			// 	log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - nodesPortInfoJSON: %s>", nodesPortInfoJSON)
			// } else {
			// 	log.Debugf("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - sampleNodePortInfoString %s does not have NodePortInfoString, could be snmpwalk to this node has failed...>", sampleNodePortInfoString)
			// }

			// time=2024-06-16T21:44:12Z level=info msg={
			// 	"nodeName": "clab-nokia-ServiceProvider-R07-PE-ASBR",
			// 	"ifName": "1/1/1",
			// 	"ifDescription": "1/1/1, 10/100/Gig Ethernet SFP, \"IP-PTP-010.007.010.001/29\"",
			// 	"ifPhysAddress": "0C:00:D4:1E:56:01",
			// 	"ifMtu": "8704",
			// 	"ifType": "ethernet-csmacd",
			// 	"ifAdminStatus": "up",
			// 	"ifOperStatus": "up",
			// 	"ifExtraField": ""
			//   }

			// jsonBytesCytoUiBeforeSnmpwalk, err := json.MarshalIndent(cytoElements, "", "  ")
			// if err != nil {
			// 	log.Error(err)
			// 	panic(err)
			// }
			// log.Info("jsonBytesCytoUiBeforeSnmpwalk Result:", string(jsonBytesCytoUiBeforeSnmpwalk))

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
						log.Infof("<go_cloudshellwrapper><D>getAllNodeEndpointDetail - clabSourceLongName: %s>", clabSourceLongName)

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
			w.Write(jsonBytesCytoUiAfterSnmpwalk) // send modifiedJSON as response to browser

		})

	router.HandleFunc("/reload",
		func(w http.ResponseWriter, r *http.Request) {
			// Perform your operations here...

			// Send a response that includes JavaScript to reload the page
			w.Header().Set("Content-Type", "text/html")
			fmt.Fprintf(w, `
				<html>
				<head>
					<script type="text/javascript">
						window.onload = function() {
							window.location.reload();
						}
					</script>
				</head>
				<body>
					<p>Reloading...</p>
				</body>
				</html>
			`)
		})

	// // websocket endpoint
	// // websocket endpoint
	router.HandleFunc("/ws",
		func(w http.ResponseWriter, r *http.Request) {
			// Upgrade this connection to a WebSocket connection
			ws, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Info(err)
				return // Return to exit the handler if WebSocket upgrade fails
			}
			defer ws.Close() // Ensure WebSocket connection is closed when the handler exits

			log.Infof("WebSocket endpoint called")

			// Simulating telemetry data...
			rand.Seed(time.Now().UnixNano())
			var number int

			for i := 0; i < 10000; i++ {
				select {
				case <-r.Context().Done():
					log.Info("WebSocket connection closed due to client disconnect")
					return // Return to exit the loop when the client disconnects
				default:
					number = rand.Intn(60) + 1
					message := []byte(strconv.Itoa(number))
					err = ws.WriteMessage(websocket.TextMessage, message)
					if err != nil {
						log.Info(err)
						return // Return to exit the handler if write fails
					}
					time.Sleep(2 * time.Second)
					log.Infof("Sending telemetry via WebSocket: %v", message)
				}
			}
		})

	// // websocketUptime endpoint
	// // websocketUptime endpoint
	router.HandleFunc("/uptime",
		func(w http.ResponseWriter, r *http.Request) {
			var message time.Duration

			// Upgrade this connection to a WebSocket connection
			uptime, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Info(err)
				return // Return to exit the handler if WebSocket upgrade fails
			}
			defer func() {
				// Remove the connection from the active connections list when the handler exits
				connectionsMu.Lock()
				delete(connections, uptime)
				connectionsMu.Unlock()
				uptime.Close() // Close the WebSocket connection when the handler exits
			}()

			log.Infof("uptime endpoint called")

			// Simulating uptime...
			// Add the new connection to the active connections list
			connectionsMu.Lock()
			connections[uptime] = true
			connectionsMu.Unlock()

			for {
				select {
				case <-r.Context().Done():
					log.Info("WebSocket connection closed due to client disconnect")
					return // Return to exit the loop when the client disconnects
				default:
					log.Debugf("Uptime %s\n", time.Since(StartTime))
					message = time.Since(StartTime)
					uptimeString := strings.Split(strings.Split(message.String(), "s")[0], ".")[0] + "s"
					err = uptime.WriteMessage(websocket.TextMessage, []byte(uptimeString))
					if err != nil {
						log.Debug("Error writing message:", err)
						return // Return to exit the handler if write fails
					}
					time.Sleep(10 * time.Second)
				}
			}
		})

	// // websocketcontainerNodeStatus endpoint
	// // websocketcontainerNodeStatus endpoint
	router.HandleFunc("/containerNodeStatus",
		func(w http.ResponseWriter, r *http.Request) {
			// Upgrade this connection to a WebSocket connection
			containerNodeStatus, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Info(err)
				return // Return to exit the handler if WebSocket upgrade fails
			}
			defer func() {
				containerNodeStatus.Close() // Close the WebSocket connection when the handler exits
			}()

			log.Infof("containerNodeStatus endpoint called")

			clabUser := confClab.GetString("clab-user")
			log.Infof("clabUser: '%s'", clabUser)
			clabHost := confClab.GetStringSlice("allowed-hostnames")
			log.Infof("clabHost: '%s'", clabHost[0])
			clabPass := confClab.GetString("clab-pass")
			log.Infof("clabPass: '%s'", clabPass)

			// simulating containerNodeStatus...
			// Add the new connection to the active connections list

			for {
				select {
				case <-r.Context().Done():
					log.Info("WebSocket connection closed due to client disconnect")
					return // Return to exit the loop when the client disconnects
				default:
					for _, n := range cyTopo.ClabTopoDataV2.Nodes {
						// get docker status via unix socket
						x, err := cyTopo.GetDockerNodeStatusViaUnixSocket(n.Longname, clabHost[0])

						if err != nil {
							log.Error(err)
							return // Return to exit the handler if an error occurs
						}

						err = containerNodeStatus.WriteMessage(websocket.TextMessage, x)
						if err != nil {
							log.Info(err)
							return // Return to exit the handler if write fails
						}
					}
					// Pause for a short duration (e.g., 5 seconds)
					time.Sleep(5 * time.Second)
				}
			}
		})

	//// websocket clabServerAddress endpoint
	//// websocket clabServerAddress endpoint
	router.HandleFunc("/clabServerAddress",
		func(w http.ResponseWriter, r *http.Request) {
			// Upgrade this connection to a WebSocket connection
			clabServerAddress, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Info(err)
				return // Return to exit the handler if WebSocket upgrade fails
			}

			defer func() {
				clabServerAddress.Close() // Close the WebSocket connection when the handler exits
			}()

			clabHost := confClab.GetStringSlice("allowed-hostnames")
			log.Infof("clabServerAddress endpoint called, clabHost is %s", clabHost[0])

			// Write the clabHost value to the WebSocket connection
			err = clabServerAddress.WriteMessage(websocket.TextMessage, []byte(clabHost[0]))
			if err != nil {
				log.Info(err)
				return // Return to exit the handler if write fails
			}
		})

	//// clabNetem endpoint
	//// clabNetem endpoint
	router.HandleFunc("/clabNetem",
		func(w http.ResponseWriter, r *http.Request) {

			// Parse the request body
			var requestData map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			// Access the parameters
			command := requestData["param1"].(string)
			emptyPadding := requestData["param2"].(string)

			log.Infof("clabNetem endpoint called")

			log.Infof("clabNetem-Param1: %s", command)
			log.Infof("clabNetem-Param2: %s", emptyPadding)

			clabUser := confClab.GetString("clab-user")
			clabHost := confClab.GetStringSlice("allowed-hostnames")
			clabPass := confClab.GetString("clab-pass")

			log.Infof("clabUser: '%s'", clabUser)
			log.Infof("clabHost: '%s'", clabHost[0])
			log.Infof("clabPass: '%s'", clabPass)

			if deploymentType == "colocated" {

				log.Infof("executing exec command, since deployment type is colocated")

				returnData, err := cyTopo.RunExecCommand(clabUser, clabHost[0], command)

				// Create a response JSON object
				responseData := map[string]interface{}{
					"result":      "Netem command received",
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

			} else {
				// call function to run SSH commnd
				// returnData, err := cyTopo.RunSSHCommand(clabUser, clabHost[0], clabPass, command)

				returnData, err := tools.SshSudo(clabHost[0], "22", clabUser, clabPass, command)

				// Create a response JSON object
				responseData := map[string]interface{}{
					"result":      "Netem command received",
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
		}).Methods("POST")

	//// getUsage endpoint
	//// getUsage endpoint
	router.HandleFunc("/compute-resource-usage",
		func(w http.ResponseWriter, r *http.Request) {

			ctx := context.Background()
			cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			cpuPercent, err := cpu.Percent(0, false)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			memInfo, err := mem.VirtualMemory()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			containers, err := cli.ContainerList(ctx, types.ContainerListOptions{})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			containerUsages := []ContainerUsage{}
			for _, container := range containers {
				stats, err := cli.ContainerStatsOneShot(ctx, container.ID)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				var statsData types.StatsJSON
				err = json.NewDecoder(stats.Body).Decode(&statsData)
				stats.Body.Close()
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				cpuDelta := float64(statsData.CPUStats.CPUUsage.TotalUsage - statsData.PreCPUStats.CPUUsage.TotalUsage)
				systemDelta := float64(statsData.CPUStats.SystemUsage - statsData.PreCPUStats.SystemUsage)
				numberCPUs := float64(statsData.CPUStats.OnlineCPUs)
				cpuPercent := (cpuDelta / systemDelta) * numberCPUs * 100.0

				memoryUsage := float64(statsData.MemoryStats.Usage) / float64(statsData.MemoryStats.Limit) * 100.0

				containerUsages = append(containerUsages, ContainerUsage{
					ID:     container.ID,
					Name:   container.Names[0],
					CPU:    cpuPercent,
					Memory: memoryUsage,
				})
			}

			usageData := UsageData{
				CPU:        cpuPercent[0],
				Memory:     memInfo.UsedPercent,
				Containers: containerUsages,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(usageData)

		}).Methods("GET")

	// API endpoint to list files
	// API endpoint to list files
	router.HandleFunc("/files", func(w http.ResponseWriter, r *http.Request) {
		// Define the directory to list files from
		RouterName := r.URL.Query().Get("RouterName")
		if RouterName == "" {
			http.Error(w, "Missing directory parameter", http.StatusBadRequest)
			return
		}

		workingDirectory, _ := os.Getwd()
		routerBackupDirectory := path.Join(workingDirectory, HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/node-backup/"+RouterName)

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
		json.NewEncoder(w).Encode(response)

	}).Methods("GET")

	// API endpoint to read file
	// API endpoint to read file
	router.HandleFunc("/file",
		func(w http.ResponseWriter, r *http.Request) {
			fileName := r.URL.Query().Get("name")
			if fileName == "" {
				http.Error(w, "Missing file name", http.StatusBadRequest)
				return
			}

			// Define the directory to list files from
			RouterName := r.URL.Query().Get("RouterName")
			if RouterName == "" {
				http.Error(w, "Missing directory parameter", http.StatusBadRequest)
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
		}).Methods("GET")

	//// nodeBackupRestore endpoint
	//// nodeBackupRestore endpoint
	router.HandleFunc("/nodeBackupRestore",
		func(w http.ResponseWriter, r *http.Request) {

			// Parse the request body
			var requestData map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			// Access the parameters
			RouterId := requestData["param1"].(string)
			configName := requestData["param2"].(string)
			Flag := requestData["param3"].(string)

			log.Infof("<go_cloudshellwrapper><I>nodeBackupRestore - RouterId: %s >", RouterId)
			log.Infof("<go_cloudshellwrapper><I>nodeBackupRestore - configName: %s >", configName)
			log.Infof("<go_cloudshellwrapper><I>nodeBackupRestore - flag: %s >", Flag)

			clabUser := confClab.GetString("clab-user")
			clabHost := confClab.GetStringSlice("allowed-hostnames")
			clabPass := confClab.GetString("clab-pass")

			log.Infof("clabUser: '%s'", clabUser)
			log.Infof("clabHost: '%s'", clabHost[0])
			log.Infof("clabPass: '%s'", clabPass)

			os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/node-backup/"+RouterId, 0755)

			// aarafat-tag: to be fixed, the Endpoint should be generic and only getting the ssh command in raw ie: "python3 /home/aarafat/topoViewer/html-static/actions/backupRestoreScript/backupRestoreScript.py --ip_address 10.2.1.108 --username admin --password admin --configname clab-nokia-ServiceProvider-R08-PE-date.cfg --kind vr-sros --directory /home/aarafat/topoViewer/html-public/nokia-ServiceProvider/node-backup/clab-nokia-ServiceProvider-R08-PE/ --backup"
			// all data massaging shall be done in JS. the Go endPoint only passing the ssh command to pyton script.

			deviceKind := "vr-sros"
			logDirectory := fmt.Sprintf("%s/logs/", workingDirectory)

			// this is static "/home/aarafat/topoViewer/html-static/actions/"

			// command := "python3 /home/aarafat/topoViewer/html-static/actions/backupRestoreScript/backupRestoreScript.py --ip_address 10.2.1.108 --username admin --password admin --configname clab-nokia-ServiceProvider-R08-PE-date.cfg --kind vr-sros --directory /home/aarafat/topoViewer/html-public/nokia-ServiceProvider/node-backup/clab-nokia-ServiceProvider-R08-PE/ --backup"
			command := fmt.Sprintf("python3 /home/aarafat/topoViewer/html-static/actions/backupRestoreScript/backupRestoreScript.py --ip_address %s --username admin --password admin --configname %s --kind %s --directory /home/aarafat/topoViewer/html-public/nokia-ServiceProvider/node-backup/%s/ --log_directory %s --%s", RouterId, configName, deviceKind, configName, logDirectory, Flag)

			returnData, err := tools.Ssh(clabHost[0], "22", clabUser, clabPass, command)

			if err != nil {
				log.Errorf("Failed to send ssh command")
				return
			}

			log.Info("#############################")

			log.Info(returnData)

			// Create a response JSON object
			responseData := map[string]interface{}{
				"result":      "nodeBackupRestore command executed",
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

		}).Methods("POST")

	//// getEnvironments endpoint
	//// getEnvironments endpoint
	router.HandleFunc("/get-environments",
		func(w http.ResponseWriter, r *http.Request) {

			type Environments struct {
				EnvWorkingDirectory string `json:"working-directory"`
				EnvClabName         string `json:"clab-name"`
				EnvCyTopoJsonBytes  []topoengine.CytoJson
			}

			var cytoTopoJson []topoengine.CytoJson
			err := json.Unmarshal(cyTopoJsonBytes, &cytoTopoJson)
			if err != nil {
				fmt.Println("Error parsing JSON:", err)
				return
			}

			environments := Environments{
				EnvWorkingDirectory: workingDirectory,
				EnvClabName:         cyTopo.ClabTopoDataV2.Name,
				EnvCyTopoJsonBytes:  cytoTopoJson,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(environments)

		}).Methods("GET")

	//// python-action endpoint
	//// python-action endpoint
	router.HandleFunc("/python-action",
		func(w http.ResponseWriter, r *http.Request) {

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

			// // to be deleted
			// returnData := "ok"
			// var err error
			// err = nil
			// // to be deleted

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

		}).Methods("POST")

	// starting HTTP server
	// this is the endpoint for serving xterm.js assets
	depenenciesDirectorXterm := path.Join(workingDirectory, "./html-static/cloudshell/node_modules")
	router.PathPrefix("/assets").Handler(http.StripPrefix("/assets", http.FileServer(http.Dir(depenenciesDirectorXterm))))

	// this is the endpoint for serving cytoscape.js assets
	depenenciesDirectoryCytoscape := path.Join(workingDirectory, "./html-static/cytoscape")
	router.PathPrefix("/cytoscape").Handler(http.StripPrefix("/cytoscape", http.FileServer(http.Dir(depenenciesDirectoryCytoscape))))

	// this is the endpoint for serving css asset
	depenenciesDirectoryCss := path.Join(workingDirectory, "./html-static/css")
	router.PathPrefix("/css").Handler(http.StripPrefix("/css", http.FileServer(http.Dir(depenenciesDirectoryCss))))

	// // this is the endpoint for the root path aka website shell
	publicAssetsDirectoryHtml := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoDataV2.Name)
	router.PathPrefix("/").Handler(http.FileServer(http.Dir(publicAssetsDirectoryHtml)))

	//create html-public files
	// os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name, 0755) // already created in cytoscapemodel library
	os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/cloudshell", 0755)
	os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/clab-client", 0755)
	os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools", 0755)
	os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/ws", 0755)
	os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/images", 0755)

	os.Mkdir(HtmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/node-backup", 0755)

	sourceImageFolder := HtmlStaticPrefixPath + "images"
	destinationImageFolder := HtmlPublicPrefixPath + cyTopo.ClabTopoDataV2.Name + "/images"
	err := cp.Copy(sourceImageFolder, destinationImageFolder)
	log.Debug("Copying images folder error: ", err)

	sourceClabClientFolder := HtmlStaticPrefixPath + "clab-client"
	destinationClabClientImageFolder := HtmlPublicPrefixPath + cyTopo.ClabTopoDataV2.Name + "/clab-client"
	err1 := cp.Copy(sourceClabClientFolder, destinationClabClientImageFolder)
	log.Debug("Copying clab-client folder error: ", err1)

	indexHtmldata := IndexHtmlStruct{
		LabName:        cyTopo.ClabTopoDataV2.Name,
		DeploymentType: deploymentType,
	}

	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "cy-style.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"cy-style.json", indexHtmldata)
	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"index.html", indexHtmldata)
	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"terminal.js", indexHtmldata)
	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "tools-cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"index.html", indexHtmldata)
	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "tools-cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"terminal.js", indexHtmldata)
	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "websocket-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/ws/"+"index.html", indexHtmldata)

	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "button.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"button.html", indexHtmldata)

	createHtmlPublicFiles(HtmlTemplatePath, HtmlPublicPrefixPath, "index.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"index.html", indexHtmldata)

	// start memory logging pulse
	logWithMemory := createMemoryLog()
	go func(tick *time.Ticker) {
		for {
			logWithMemory.Debug("tick")
			<-tick.C
		}
	}(time.NewTicker(time.Second * 30))

	// listen
	listenOnAddress := fmt.Sprintf("%s:%v", serverAddress, serverPort)
	server := http.Server{
		Addr:    listenOnAddress,
		Handler: addIncomingRequestLogging(router),
	}

	log.Infof("starting server on interface:port '%s'...", listenOnAddress)
	return server.ListenAndServe()

}
