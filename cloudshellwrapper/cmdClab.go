package cloudshellwrapper

import (
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/asadarafat/topoViewer/topoengine"
	"github.com/asadarafat/topoViewer/xtermjs"
	"github.com/usvc/go-config"

	log "github.com/asadarafat/topoViewer/tools"
	cp "github.com/otiai10/copy"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/cobra"
)

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
		Usage:   fmt.Sprintf("defines the format of the logs - one of ['%s']", strings.Join(log.ValidFormatStrings, "', '")),
	},
	"log-level": &config.String{
		Default: "debug",
		Usage:   fmt.Sprintf("defines the minimum level of logs to show - one of ['%s']", strings.Join(log.ValidLevelStrings, "', '")),
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
		Shorthand: "p",
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
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

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
	for {
		// read in a message
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Info(err)
			return
		}
		// print out that message for clarity
		log.Info(string(p))

		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Info(err)
			return
		}

	}
}

func Clab(_ *cobra.Command, _ []string) error {
	// initialise the logger
	log.Init(log.Format(confClab.GetString("log-format")), log.Level(confClab.GetString("log-level")))

	// tranform clab-topo-file into cytoscape-model
	// aarafat-tag: check if provided topo in json or yaml
	topoClab := confClab.GetString("topology-file-json")

	log.Info("topoFilePath: ", topoClab)

	cyTopo := topoengine.CytoTopology{}
	cyTopo.LogLevel = 4
	cyTopo.InitLogger()

	//// Clab Version 1
	// cyTopo.MarshalContainerLabTopov1(topoClab)
	// ClabTopoStruct := topoengine.ClabTopoStruct{}
	// jsonBytes := cyTopo.UnmarshalContainerLabTopov1(ClabTopoStruct, confClab.GetString("clab-user"))

	//// Clab Version 2
	log.Debugf("topo Clab: ", topoClab)
	log.Debug("Code Trace Point ####")
	topoFile := cyTopo.ClabTopoRead(topoClab) // loading containerLab export-topo json file
	jsonBytes := cyTopo.UnmarshalContainerLabTopoV2(topoFile )
	cyTopo.PrintjsonBytesCytoUiV2(jsonBytes)

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
	log.Infof("topology file path    : '%s'", workingDirectory+"/"+topoClab)
	log.Infof("working directory     : '%s'", workingDirectory)
	log.Infof("command               : '%s'", command)
	log.Infof("arguments             : ['%s']", strings.Join(arguments, "', '"))

	log.Infof("allowed hosts         : ['%s']", strings.Join(allowedHostnames, "', '"))
	log.Infof("connection error limit: %v", connectionErrorLimit)
	log.Infof("keepalive ping timeout: %v", keepalivePingTimeout)
	log.Infof("max buffer size       : %v bytes", maxBufferSizeBytes)
	log.Infof("server address        : '%s' ", serverAddress)
	log.Infof("server port           : %v", serverPort)

	log.Infof("liveness checks path  : '%s'", pathLiveness)
	log.Infof("readiness checks path : '%s'", pathReadiness)
	log.Infof("metrics endpoint path : '%s'", pathMetrics)
	log.Infof("xtermjs endpoint path : '%s'", pathXTermJS)

	// configure routing
	router := mux.NewRouter()

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
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// liveness probe endpoint
	router.HandleFunc(pathLiveness, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// metrics endpoint
	router.Handle(pathMetrics, promhttp.Handler())

	// version endpoint
	router.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(VersionInfo))
		log.Info("##################### " + VersionInfo)

	})

	// cloudshell endpoint
	router.HandleFunc("/cloudshell}",
		func(w http.ResponseWriter, r *http.Request) {
			log.Info(xtermjsHandlerOptions)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(VersionInfo))

			params := mux.Vars(r)
			RouterId := params["id"]
			log.Info("##################### " + RouterId)
		})

	// cloudshell-tools endpoint
	router.HandleFunc("/cloudshell-tools}",
		func(w http.ResponseWriter, r *http.Request) {
			log.Info(xtermjsHandlerOptions)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(VersionInfo))

			log.Info("##################### cloudshell-tools")
		})

	// websocket endpoint
	router.HandleFunc("/ws",
		// router.HandleFunc("/",
		func(w http.ResponseWriter, r *http.Request) {
			// upgrade this connection to a WebSocket
			// connection
			log.Info("##################### " + VersionInfo)

			ws, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Info(err)
			}
			log.Infof("################## Websocket: Client Connected")
			w.WriteHeader(http.StatusOK)

			var message []byte

			rand.Seed(time.Now().UnixNano())
			var number int

			for i := 0; i < 10000; i++ {
				number = rand.Intn(60) + 1
				message = []byte(strconv.Itoa(number))
				err = ws.WriteMessage(1, message)
				if err != nil {
					log.Info(err)
				}
				time.Sleep(1 * time.Second)
			}

			// listen indefinitely for new messages coming
			// through on our WebSocket connection
			reader(ws)
		})

	// this is the endpoint for serving xterm.js assets
	depenenciesDirectorXterm := path.Join(workingDirectory, "./html-static/cloudshell/node_modules")
	router.PathPrefix("/assets").Handler(http.StripPrefix("/assets", http.FileServer(http.Dir(depenenciesDirectorXterm))))

	// this is the endpoint for serving cytoscape.js assets
	depenenciesDirectoryCytoscape := path.Join(workingDirectory, "./html-static/cytoscape")
	router.PathPrefix("/cytoscape").Handler(http.StripPrefix("/cytoscape", http.FileServer(http.Dir(depenenciesDirectoryCytoscape))))

	// this is the endpoint for serving dataCyto.json asset
	depenenciesDirectoryDataCyto := path.Join(workingDirectory, "./html-static/cytoscapedata")
	router.PathPrefix("/cytoscapedata").Handler(http.StripPrefix("/cytoscapedata", http.FileServer(http.Dir(depenenciesDirectoryDataCyto))))

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
	log.Debugf("Copying images folder error: ", err)

	sourceClabClientFolder := htmlStaticPrefixPath + "clab-client"
	destinationClabClientImageFolder := htmlPublicPrefixPath + cyTopo.ClabTopoDataV2.Name + "/clab-client"
	err1 := cp.Copy(sourceClabClientFolder, destinationClabClientImageFolder)
	log.Debugf("Copying clab-client folder error: ", err1)

	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "index.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"index.html", "dataCytoMarshall-"+cyTopo.ClabTopoDataV2.Name+".json")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cy-style.tmpl", cyTopo.ClabTopoDataV2.Name+"/"+"cy-style.json", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"index.html", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell/"+"terminal.js", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "tools-cloudshell-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"index.html", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "tools-cloudshell-terminal-js.tmpl", cyTopo.ClabTopoDataV2.Name+"/cloudshell-tools/"+"terminal.js", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "websocket-index.tmpl", cyTopo.ClabTopoDataV2.Name+"/ws/"+"index.html", "")

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
