package main

import (
	"io/ioutil"
	"os"

	"github.com/asadarafat/topoViewer/topoengine"
	log "github.com/sirupsen/logrus"
)

// "io/ioutil"
// "os"

func main() {

	cytoUiGo := topoengine.CytoTopology{}
	cytoUiGo.LogLevel = 5
	cytoUiGo.InitLogger()
	cytoUiGo.InitLoggerDigitalTwin()

	// clab run
	// cytoUiGo.MarshalContainerLabTopo("clab-topo-file.yaml")
	// clabTopoJson := topoengine.ClabTopoJson{}
	// cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// jsonBytes := cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// // log.Info(jsonBytes)
	// cytoUiGo.PrintjsonBytesCytoUi(jsonBytes)

	// Nsp Ietf L2
	// Nsp Ietf L2
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// log.Info(topoFile)
	// cytoUiGo.IetfL2TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL2{})
	// jsonBytesL2 := cytoUiGo.IetfL2TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL2{})
	// cytoUiGo.IetfL2TopoPrintjsonBytesCytoUi(jsonBytesL2)

	// Nsp Ietf L3
	// Nsp Ietf L3
	// var topoFileList []string

	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:55000:2-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:65000:1-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-1:65000:1-isis.json")
	// log.Info(topoFileList)
	// topoFileByte0 := cytoUiGo.IetfL3TopoRead(topoFileList[0])
	// topoFileByte1 := cytoUiGo.IetfL3TopoRead(topoFileList[1])
	// topoFileByte2 := cytoUiGo.IetfL3TopoRead(topoFileList[2])

	// var topoL3FileByteCombine [][]byte
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte0)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte1)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte2)

	// log.Info(topoFileByteCombine)
	// jsonBytesL3 := cytoUiGo.IetfL3TopoUnMarshal(topoFileByteCombine, topoengine.IetfNetworkTopologyL3{})
	// cytoUiGo.IetfL3TopoPrintjsonBytesCytoUi(jsonBytesL3)

	// // Nsp Ietf Multi L2 L3
	// // Nsp Ietf Multi L2 L3
	// // load L2 topo nya dulu
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// topoFileL2 := topoFile

	// // load L3 topo nya dulu
	// var topoFileList []string
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:55000:2-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:65000:1-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-1:65000:1-isis.json")
	// log.Info(topoFileList)
	// topoFileByte0 := cytoUiGo.IetfL3TopoRead(topoFileList[0])
	// topoFileByte1 := cytoUiGo.IetfL3TopoRead(topoFileList[1])
	// topoFileByte2 := cytoUiGo.IetfL3TopoRead(topoFileList[2])

	// var topoL3FileByteCombine [][]byte
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte0)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte1)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte2)

	// jsonBytesMultiL2L3 := cytoUiGo.IetfMultiL2L3TopoUnMarshal(topoFileL2, topoL3FileByteCombine, topoengine.IetfNetworkTopologyMultiL2L3{})
	// cytoUiGo.IetfMultiLayerTopoPrintjsonBytesCytoUi(jsonBytesMultiL2L3)

	// // Nsp digitalTwin
	// // Nsp digitalTwin
	// // Nsp digitalTwin
	filePath, _ := os.Getwd()
	filePath = (filePath + "/rawTopoFile/")
	log.Info("topology file path: ", filePath)

	topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	// log.Info(topoFile)
	cytoUiGo.NspDigitalTwinTopoUnmarshal(topoFile, topoengine.IetfNetworkTopologyL2{})

}
