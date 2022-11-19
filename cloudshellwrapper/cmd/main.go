package main

import (
	"errors"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"path"
	"runtime"
	"strings"
	"time"

	"github.com/asadarafat/topoViewer/topoengine"
	"github.com/asadarafat/topoViewer/xtermjs"

	log "github.com/asadarafat/topoViewer/tools"

	"github.com/usvc/go-config"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/cobra"
)

var VersionInfo string

var conf = config.Map{
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
	"topo-clab": &config.String{
		Default:   ".",
		Usage:     "path to containerlab topo file",
		Shorthand: "t",
	},
}

func main() {

	if VersionInfo == "" {
		VersionInfo = "dev"
	}
	command := cobra.Command{
		Use:     "topoviewer",
		Short:   "Creates a web-based shell using xterm.js that links to an actual shell",
		Version: VersionInfo,
		RunE:    runE,
	}
	conf.ApplyToCobra(&command)
	command.Execute()
}

// check if template file exist
func FileExists(filename string) bool {
	f, err := os.Stat(filename)
	if err != nil {
		log.Debugf("error while trying to access file %v: %v", filename, err)
		return false
	}

	return !f.IsDir()
}

// createRequestLog returns a logger with relevant request fields
func createRequestLog(r *http.Request, additionalFields ...map[string]interface{}) log.Logger {
	fields := map[string]interface{}{}
	if len(additionalFields) > 0 {
		fields = additionalFields[0]
	}
	if r != nil {
		fields["host"] = r.Host
		fields["remote_addr"] = r.RemoteAddr
		fields["method"] = r.Method
		fields["protocol"] = r.Proto
		fields["path"] = r.URL.Path
		fields["request_url"] = r.URL.String()
		fields["user_agent"] = r.UserAgent()
		fields["cookies"] = r.Cookies()
	}
	return log.WithFields(fields)
}

func createMemoryLog() log.Logger {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	return log.WithFields(map[string]interface{}{
		"alloc":       memStats.Alloc,
		"heap_alloc":  memStats.HeapAlloc,
		"total_alloc": memStats.TotalAlloc,
		"sys_alloc":   memStats.Sys,
		"gc_count":    memStats.NumGC,
	})
}

func addIncomingRequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		then := time.Now()
		defer func() {
			if recovered := recover(); recovered != nil {
				createRequestLog(r).Info("request errored out")
			}
		}()
		next.ServeHTTP(w, r)
		duration := time.Now().Sub(then)
		createRequestLog(r).Infof("request completed in %vms", float64(duration.Nanoseconds())/1000000)
	})
}
func createHtmlPublicFiles(htmlTemplatePath string, htmlPublicPrefixPath string, templateFile string, outputFile string, inputValue string) {
	// os.Mkdir("./html-public/"+cyTopo.ClabTopoData.ClabTopoName, 0755) // this folder created in cytoscape model library.
	template, err := template.ParseFiles(htmlTemplatePath + templateFile)
	if err != nil {
		log.Error("Could compile index.tmpl")
	}

	// create file
	file, err := os.Create(htmlPublicPrefixPath + outputFile)
	if err != nil {
		log.Error("Could not create index.html file")
	}
	// write file
	err = template.Execute(file, inputValue)
	if err != nil {
		log.Error("execute: ", err)
	}
}

func runE(_ *cobra.Command, _ []string) error {
	// initialise the logger
	log.Init(log.Format(conf.GetString("log-format")), log.Level(conf.GetString("log-level")))

	// tranform clab-topo-file into cytoscape-model
	topoClab := conf.GetString("topo-clab")
	log.Info(topoClab)
	cyTopo := topoengine.CytoTopology{}
	cyTopo.LogLevel = 4
	cyTopo.InitLogger()
	cyTopo.MarshalContainerLabTopo(topoClab)
	clabTopoJson := topoengine.ClabTopoJson{}
	cyTopo.UnmarshalContainerLabTopo(clabTopoJson)
	jsonBytes := cyTopo.UnmarshalContainerLabTopo(clabTopoJson)
	cyTopo.PrintjsonBytesCytoUi(jsonBytes)

	// debug stuff
	command := conf.GetString("command")

	// command := "/bin/bash"
	// arguments := conf.GetStringSlice("arguments")
	// command := "/usr/bin/ssh"
	// var listArguments = []string{"RouterId"}
	// arguments := listArguments
	connectionErrorLimit := conf.GetInt("connection-error-limit")
	allowedHostnames := conf.GetStringSlice("allowed-hostnames")
	keepalivePingTimeout := time.Duration(conf.GetInt("keepalive-ping-timeout")) * time.Second
	maxBufferSizeBytes := conf.GetInt("max-buffer-size-bytes")
	pathLiveness := conf.GetString("path-liveness")
	pathMetrics := conf.GetString("path-metrics")
	pathReadiness := conf.GetString("path-readiness")
	pathXTermJS := conf.GetString("path-xtermjs")
	serverAddress := conf.GetString("server-addr")
	serverPort := conf.GetInt("server-port")
	workingDirectory := conf.GetString("workdir")
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
	// log.Infof("arguments             : ['%s']", strings.Join(arguments, "', '"))

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
	publicAssetsDirectoryHtml := path.Join(workingDirectory, "./html-public/"+cyTopo.ClabTopoData.ClabTopoName)
	// publicAssetsDirectoryHtml := ("/etc/topoviewer/html-public/" + cyTopo.ClabTopoData.ClabTopoName)
	router.PathPrefix("/").Handler(http.FileServer(http.Dir(publicAssetsDirectoryHtml)))

	//create html-public files
	// htmlPublicPrefixPath := "/etc/topoviewer/html-public/"
	htmlPublicPrefixPath := "./html-public/"
	htmlTemplatePath := "./html-static/template/"

	// os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoData.ClabTopoName, 0755) // already created in cytoscapemodel library
	os.Mkdir(htmlPublicPrefixPath+cyTopo.ClabTopoData.ClabTopoName+"/cloudshell", 0755)
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "index.tmpl", cyTopo.ClabTopoData.ClabTopoName+"/"+"index.html", "dataCytoMarshall-"+cyTopo.ClabTopoData.ClabTopoName+".json")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cy-style.tmpl", cyTopo.ClabTopoData.ClabTopoName+"/"+"cy-style.json", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-index.tmpl", cyTopo.ClabTopoData.ClabTopoName+"/cloudshell/"+"index.html", "")
	createHtmlPublicFiles(htmlTemplatePath, htmlPublicPrefixPath, "cloudshell-terminal-js.tmpl", cyTopo.ClabTopoData.ClabTopoName+"/cloudshell/"+"terminal.js", "")

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

func GetDetails(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]
	log.Info(id)
}
