package cloudshellwrapper

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	"github.com/asadarafat/topoViewer/topoengine"
	"github.com/asadarafat/topoViewer/xtermjs"
	"github.com/usvc/go-config"

	log "github.com/asadarafat/topoViewer/tools"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/cobra"
)

// config
var confNsp = config.Map{
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
	"topology-ietf-l2-topo": &config.String{
		Default: ".",
		Usage:   "path to nsp ietf-l2 topo file",
	},
	"topology-ietf-l3-topo": &config.String{
		Default: ".",
		Usage:   "path to nsp ietf-l3 topo file",
	},
}

// var rootCommand = cobra.Command{
var nspCommand = cobra.Command{
	Use:     "nsp",
	Short:   "Creates a web-based topology view from Nokia NSP topology file",
	Version: VersionInfo,
	RunE:    Nsp,
}

func init() {
	// initialise the logger config clabCommand
	confNsp.ApplyToCobra(&nspCommand)
	// init clabCommand
	rootCommand.AddCommand(&nspCommand)
}

func Nsp(_ *cobra.Command, _ []string) error {

	fmt.Println("tereerereere")

	// initialise the logger
	log.Init(log.Format(confNsp.GetString("log-format")), log.Level(confNsp.GetString("log-level")))

	// tranform clab-topo-file into cytoscape-model
	topoNsp := confNsp.GetString("topology-ietf-l2-topo")
	log.Info(topoNsp)

	cyTopo := topoengine.CytoTopology{}
	cyTopo.LogLevel = 4
	cyTopo.InitLogger()
	// cyTopo.MarshalContainerLabTopo(topoClab)
	// clabTopoJson := topoengine.ClabTopoJson{}
	// cyTopo.UnmarshalContainerLabTopo(clabTopoJson)
	// jsonBytes := cyTopo.UnmarshalContainerLabTopo(clabTopoJson)
	// cyTopo.PrintjsonBytesCytoUi(jsonBytes)

	cyTopo.IetfL2TopoMarshal(topoNsp) // loading to cyTopo.IetfNetworL2TopoData
	cyTopo.IetfL2TopoUnMarshal(cyTopo.IetfNetworL2TopoData, topoengine.IetfNetworkTopologyL2{})
	jsonBytes := cyTopo.IetfL2TopoUnMarshal(cyTopo.IetfNetworL2TopoData, topoengine.IetfNetworkTopologyL2{})
	cyTopo.IetfL2TopoPrintjsonBytesCytoUi(jsonBytes)

	command := confNsp.GetString("command")
	arguments := confNsp.GetStringSlice("arguments")
	connectionErrorLimit := confNsp.GetInt("connection-error-limit")
	allowedHostnames := confNsp.GetStringSlice("allowed-hostnames")
	keepalivePingTimeout := time.Duration(confNsp.GetInt("keepalive-ping-timeout")) * time.Second
	maxBufferSizeBytes := confNsp.GetInt("max-buffer-size-bytes")
	pathLiveness := confNsp.GetString("path-liveness")
	pathMetrics := confNsp.GetString("path-metrics")
	pathReadiness := confNsp.GetString("path-readiness")
	pathXTermJS := confNsp.GetString("path-xtermjs")
	serverAddress := confNsp.GetString("server-addr")
	serverPort := confNsp.GetInt("server-port")
	workingDirectory := confNsp.GetString("workdir")
	if !path.IsAbs(workingDirectory) {
		wd, err := os.Getwd()
		if err != nil {
			message := fmt.Sprintf("failed to get working directory: %s", err)
			log.Error(message)
			return errors.New(message)
		}
		workingDirectory = path.Join(wd, workingDirectory)
	}
	log.Infof("topology file path    : '%s'", workingDirectory+"/"+topoNsp)
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
	})

	router.HandleFunc("/cloudshell}",
		func(w http.ResponseWriter, r *http.Request) {
			// router.HandleFunc(pathXTermJS, xtermjs.GetHandler(xtermjsHandlerOptions, "TEST"))
			log.Info(xtermjsHandlerOptions)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(VersionInfo))

			params := mux.Vars(r)
			RouterId := params["id"]
			log.Info("##################### " + RouterId)
		})

	// this is the endpoint for serving xterm.js assets
	depenenciesDirectorXterm := path.Join(workingDirectory, "./html-static/cloudshell/node_modules")
	// depenenciesDirectorXterm := ("/eth/topoviewer/html-static/cloudshell/node_modules")
	router.PathPrefix("/assets").Handler(http.StripPrefix("/assets", http.FileServer(http.Dir(depenenciesDirectorXterm))))

	// this is the endpoint for serving cytoscape.js assets
	depenenciesDirectoryCytoscape := path.Join(workingDirectory, "./html-static/cytoscape")
	// depenenciesDirectoryCytoscape := ("/eth/topoviewer/html-static/cytoscape")
	router.PathPrefix("/cytoscape").Handler(http.StripPrefix("/cytoscape", http.FileServer(http.Dir(depenenciesDirectoryCytoscape))))

	// this is the endpoint for serving dataCyto.json asset
	depenenciesDirectoryDataCyto := path.Join(workingDirectory, "./html-static/cytoscapedata")
	// depenenciesDirectoryDataCyto := path.Join(workingDirectory, "/etc/topoviewer/html-static/cytoscapedata")
	router.PathPrefix("/cytoscapedata").Handler(http.StripPrefix("/cytoscapedata", http.FileServer(http.Dir(depenenciesDirectoryDataCyto))))

	// this is the endpoint for serving css asset
	depenenciesDirectoryCss := path.Join(workingDirectory, "./html-static/css")
	// depenenciesDirectoryCss := ("/etc/topoviewer/html-static/css")
	router.PathPrefix("/css").Handler(http.StripPrefix("/css", http.FileServer(http.Dir(depenenciesDirectoryCss))))

	// // this is the endpoint for the root path aka website shell
	publicAssetsDirectoryHtml := path.Join(workingDirectory, "./html-public/"+"IetfTopology-L2")
	// publicAssetsDirectoryHtml := ("/etc/topoviewer/html-public/" + cyTopo.ClabTopoData.ClabTopoName)
	router.PathPrefix("/").Handler(http.FileServer(http.Dir(publicAssetsDirectoryHtml)))

	//create html-public files
	htmlPublicPrefixPath := "./html-public/"
	htmlTemplatePath := "./html-static/template/nsp/"
	// htmlTemplatePath := "./html-static/nsp"

	// topoPrefixName := "NspIetfTopoLayer2" // should be added with NSP server ip address

	// os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoData.ClabTopoName, 0755) // already created in cytoscapemodel library
	// os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoData.ClabTopoName+"/cloudshell", 0755)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "index.tmpl", "IetfTopology-L2"+"/"+"index.html", "dataIetfL2TopoCytoMarshall.json")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cy-style.tmpl", "IetfTopology-L2"+"/"+"cy-style.json", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-index.tmpl", cyTopo.ClabTopoData.ClabTopoName+"/cloudshell/"+"index.html", "")
	// createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-terminal-js.tmpl", cyTopo.ClabTopoData.ClabTopoName+"/cloudshell/"+"terminal.js", "")

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
