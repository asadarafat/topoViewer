package main

import (
	"io/ioutil"
	"os"

	log "github.com/sirupsen/logrus"

	"github.com/asadarafat/topoViewer/topoengine"
)

// "io/ioutil"
// "os"

func main() {

	cytoUiGo := topoengine.CytoTopology{}
	cytoUiGo.LogLevel = 4
	cytoUiGo.InitLogger()

	// clab run
	// cytoUiGo.MarshalContainerLabTopo("clab-topo-file.yaml")
	// clabTopoJson := topoengine.ClabTopoJson{}
	// cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// jsonBytes := cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// // log.Info(jsonBytes)
	// cytoUiGo.PrintjsonBytesCytoUi(jsonBytes)

	// // Nsp Ietf L2
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info(filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")
	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// // log.Info(topoFile)
	// cytoUiGo.IetfL2TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL2{})
	// jsonBytes := cytoUiGo.IetfL2TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL2{})
	// cytoUiGo.IetfL2TopoPrintjsonBytesCytoUi(jsonBytes)

	// Nsp Ietf L2
	filePath, _ := os.Getwd()
	filePath = (filePath + "/rawTopoFile/")
	log.Info(filePath)
	topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L3.json")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	// log.Info(topoFile)
	cytoUiGo.IetfL3TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL3{})
	jsonBytes := cytoUiGo.IetfL3TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL3{})
	cytoUiGo.IetfL3TopoPrintjsonBytesCytoUi(jsonBytes)
}
