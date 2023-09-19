package cloudshellwrapper

import (
	"html/template"
	"net/http"
	"os"
	"runtime"
	"time"

	log "github.com/asadarafat/topoViewer/tools"
	"github.com/gorilla/mux"
)

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

// func createHtmlPublicFiles(htmlTemplatePath string, htmlPublicPrefixPath string, templateFile string, outputFile string, inputValue string) {
// 	// os.Mkdir("./html-public/"+cyTopo.ClabTopoData.ClabTopoName, 0755) // this folder created in cytoscape model library.
// 	template, err := template.ParseFiles(htmlTemplatePath + templateFile)
// 	log.Debugf("Template File: ", htmlTemplatePath+templateFile)
// 	if err != nil {
// 		log.Error("Could not compile " + htmlTemplatePath + templateFile)
// 	}

// 	// create file
// 	file, err := os.Create(htmlPublicPrefixPath + outputFile)
// 	if err != nil {
// 		log.Error("Could not render " + htmlTemplatePath + templateFile + " into file")
// 	}
// 	// write file
// 	err = template.Execute(file, inputValue)
// 	if err != nil {
// 		log.Error("execute: ", err)
// 	}
// }

func createHtmlPublicFiles(htmlTemplatePath string, htmlPublicPrefixPath string, templateFile string, outputFile string, inputValue string) {
	// os.Mkdir("./html-public/"+cyTopo.ClabTopoData.ClabTopoName, 0755) // this folder created in cytoscape model library.
	template, err := template.New(templateFile).Funcs(template.FuncMap{
		"rawHTMLComment": func(comment string) template.HTML {
			return template.HTML("<!-- " + comment + " -->")
		},
		"rawJSComment": func(comment string) template.JS {
			return template.JS("//##" + comment)
		},
	}).ParseFiles(htmlTemplatePath + templateFile)

	if err != nil {
		log.Error("Could not compile " + htmlTemplatePath + templateFile)
	}

	// create file
	file, err := os.Create(htmlPublicPrefixPath + outputFile)
	if err != nil {
		log.Error("Could not render " + htmlTemplatePath + templateFile + " into file")
	}
	// write file
	err = template.Execute(file, inputValue)
	if err != nil {
		log.Error("execute: ", err)
	}
}

func GetDetails(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]
	log.Info(id)
}
