package main

import (
	"github.com/asadarafat/topoViewer/topoengine"
)

// "io/ioutil"
// "os"

func main() {

	cytoUiGo := topoengine.CytoTopology{}
	cytoUiGo.LogLevel = 4
	cytoUiGo.InitLogger()

	cytoUiGo.MarshalContainerLabTopo("clab-topo-file.yaml")

	clabTopoJson := topoengine.ClabTopoJson{}

	cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	jsonBytes := cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// log.Info(jsonBytes)

	cytoUiGo.PrintjsonBytesCytoUi(jsonBytes)

}
