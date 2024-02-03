package cloudshellwrapper

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	xtermjs "github.com/asadarafat/topoViewer/go_xtermjs"
	"github.com/usvc/go-config"

	tools "github.com/asadarafat/topoViewer/go_tools"
	cp "github.com/otiai10/copy"
	log "github.com/sirupsen/logrus"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/cobra"
)

type IndexHtmlStruct struct {
	LabName        string
	DeploymentType string
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
func reader(conn *websocket.Conn) {
	defer conn.Close()

	// Set the maximum allowed idle time for the WebSocket connection
	conn.SetReadDeadline(time.Now().Add(5 * time.Second)) // Adjust the duration as needed

	for {
		// read in a message
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			// Check for specific close error codes indicating client-initiated closure
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Info("WebSocket connection closed by the client.")
			} else {
				log.Info("Error while reading from WebSocket:", err)
			}
			return
		}
		// print out that message for clarity
		log.Info(string(p))

		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Info(err)
			return
		}
		conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	}
}

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

	//check sudo
	checkSudoAccess()

	// initialise the cloudshellLogger
	// tools.InitCloudShellLog(tools.Format(confClab.GetString("log-format")), tools.Level(confClab.GetString("log-level")))

	// tranform clab-topo-file into cytoscape-model
	// aarafat-tag: check if provided topo in json or yaml

	cyTopo := topoengine.CytoTopology{}
	toolLogger := tools.Logs{}

	cyTopo.InitLogger()
	cyTopo.LogLevel = uint32(toolLogger.MapLogLevelStringToNumber(confClab.GetString("log-level")))
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)

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
	log.Infof("topology file			: '%s'", (topoClab))
	log.Infof("depyloyment type		: %s", (deploymentType))

	log.Infof("working directory		: '%s'", workingDirectory)
	log.Infof("command			: '%s'", command)
	log.Infof("arguments			: ['%s']", strings.Join(arguments, "', '"))

	log.Infof("allowed hosts			: ['%s']", strings.Join(allowedHostnames, "', '"))
	log.Infof("connection error limit		: %v", connectionErrorLimit)
	log.Infof("keepalive ping timeout		: %v", keepalivePingTimeout)
	log.Infof("max buffer size		: %v bytes", maxBufferSizeBytes)
	log.Infof("server address			: '%s' ", serverAddress)
	log.Infof("server port			: %v", serverPort)

	log.Infof("liveness checks path		: '%s'", pathLiveness)
	log.Infof("readiness checks path		: '%s'", pathReadiness)
	log.Infof("metrics endpoint path		: '%s'", pathMetrics)
	log.Infof("xtermjs endpoint path		: '%s'", pathXTermJS)
	log.Infof("====== Start up Parameter ======")

	// configure routing
	router := mux.NewRouter()

	topoFile := cyTopo.ClabTopoRead(topoClab) // loading containerLab export-topo json file
	// topoFile := cyTopo.ClabTopoRead(path.Join("", topoClab)) // loading containerLab export-topo json file
	jsonBytes := cyTopo.UnmarshalContainerLabTopoV2(topoFile, clabHostUsername)
	cyTopo.PrintjsonBytesCytoUiV2(jsonBytes)

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
	router.HandleFunc(pathReadiness, func(w http.ResponseWriter, r *http.Request) {
		// w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// liveness probe endpoint
	router.HandleFunc(pathLiveness, func(w http.ResponseWriter, r *http.Request) {
		// w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// metrics endpoint
	router.Handle(pathMetrics, promhttp.Handler())

	// version endpoint
	router.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
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
			log.Infof("clabUser: '%s'", clabUser)
			clabHost := confClab.GetStringSlice("allowed-hostnames")
			log.Infof("clabHost: '%s'", clabHost[0])
			clabPass := confClab.GetString("clab-pass")
			log.Infof("clabPass: '%s'", clabPass)

			// call function to run SSH commnd
			cyTopo.RunSSHCommand(clabUser, clabHost[0], clabPass, command)

			// Create a response JSON object
			responseData := map[string]interface{}{
				"result": "Netem command received",
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
	htmlPublicPrefixPath := "./html-public/"
	htmlStaticPrefixPath := "./html-static/"
	htmlTemplatePath := "./html-static/template/clab/"

	// os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name, 0755) // already created in cytoscapemodel library
	os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/cloudshell", 0755)
	os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/clab-client", 0755)
	os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools", 0755)
	os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/ws", 0755)
	os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoDataV2.Name+"/images", 0755)

	sourceImageFolder := htmlStaticPrefixPath + "images"
	destinationImageFolder := htmlPublicPrefixPath + cyTopo.ClabTopoDataV2.Name + "/images"
	err := cp.Copy(sourceImageFolder, destinationImageFolder)
	log.Debug("Copying images folder error: ", err)

	sourceClabClientFolder := htmlStaticPrefixPath + "clab-client"
	destinationClabClientImageFolder := htmlPublicPrefixPath + cyTopo.ClabTopoDataV2.Name + "/clab-client"
	err1 := cp.Copy(sourceClabClientFolder, destinationClabClientImageFolder)
	log.Debug("Copying clab-client folder error: ", err1)

	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "index.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"index.html", "dataCytoMarshall-"+cyTopo.ClabTopoDataV2.Name+".json")

	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "index.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"index.html", cyTopo.ClabTopoDataV2.Name)
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cy-style.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"cy-style.json", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"index.html", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"terminal.js", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "tools-cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"index.html", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "tools-cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"terminal.js", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "websocket-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/ws/"+"index.html", "")

	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "button.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"button.html", cyTopo.ClabTopoDataV2.Name)

	indexHtmldata := IndexHtmlStruct{
		LabName:        cyTopo.ClabTopoDataV2.Name,
		DeploymentType: deploymentType,
	}

	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cy-style.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"cy-style.json", indexHtmldata)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"index.html", indexHtmldata)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"terminal.js", indexHtmldata)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "tools-cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"index.html", indexHtmldata)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "tools-cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"terminal.js", indexHtmldata)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "websocket-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/ws/"+"index.html", indexHtmldata)

	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "button.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"button.html", indexHtmldata)

	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "index.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"index.html", indexHtmldata)

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
