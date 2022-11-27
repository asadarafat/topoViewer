package topoengine

import (
	"encoding/json"
	"os"
	"os/user"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

	tools "github.com/asadarafat/topoViewer/tools"

	"github.com/srl-labs/containerlab/clab"
	nodes "github.com/srl-labs/containerlab/nodes"
	types "github.com/srl-labs/containerlab/types"
)

// Containerlab Struct
type ClabTopo struct {
	ClabTopoName string                `json:"clabTopoName"`
	ClabNodes    map[string]nodes.Node `json:"clabNodes"` // from clab Package
	ClabLinks    map[int]*types.Link   `json:"clabLinks"` // from clab Package
}

// Containerlab Json Struct
type ClabTopoJson struct {
	Name  string                  `json:"name"`
	Nodes map[string]ClabNodeJson `json:"nodes,omitempty"`
	Links map[int]ClabLinkJson    `json:"links,omitempty"`
}
type ClabNodeJson struct {
	types.ContainerDetails
	Vars map[string]interface{} `json:"vars,omitempty"`
}

type ClabLinkJson struct {
	clab.Link
	Vars map[string]interface{} `json:"vars,omitempty"`
}

func (cyTopo *CytoTopology) InitLogger() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) MarshalContainerLabTopo(topoFile string) error {
	log.Info(topoFile)
	// static definition of topofile path
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info(filePath + topoFile)

	c, err := clab.NewContainerLab(
		clab.WithTimeout(time.Second*30),
		clab.WithTopoFile(topoFile, ""),
	)
	log.Info(topoFile)

	if err != nil {
		return err
	}
	cyTopo.ClabTopoData.ClabNodes = c.Nodes
	cyTopo.ClabTopoData.ClabLinks = c.Links
	cyTopo.ClabTopoData.ClabTopoName = c.Config.Name

	return nil
}

func (cyTopo *CytoTopology) UnmarshalContainerLabTopo(ClabTopoJson) []byte {

	cytoJson := CytoJson{}
	cytoJsonArray := []CytoJson{}

	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}
	Username := user.Username

	// node := CytoNode{
	// 	ExtraData: make(map[string]interface{}, 0),
	// }
	// link := CytoLink{
	// 	ExtraData: make(map[string]interface{}, 0),
	// }

	for i, n := range cyTopo.ClabTopoData.ClabNodes {

		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = string(i)
		cytoJson.Data.Weight = "2"
		cytoJson.Data.Name = n.Config().ShortName

		cytoJson.Data.ExtraData = map[string]interface{}{

			// "eggs": struct {
			// 	source string
			// 	price  float64
			// }{"chicken", 1.75},

			"ClabServerUsername": Username,
			"ClabNodeName":       n.Config().ShortName,
			"ClabNodeLongName":   n.Config().LongName,
			"ID":                 string(i),
			"Weight":             "2",
			"Name":               n.Config().ShortName,
			"ClabKind":           n.Config().Kind,
			"Image":              n.Config().Image,
			"ClabGroup":          n.Config().Group,
			"MgmtIPv4Address":    n.Config().MgmtIPv4Address,
			"MgmtIPv6Address":    n.Config().MgmtIPv6Address,
		}
		cytoJsonArray = append(cytoJsonArray, cytoJson)

	}

	for i, l := range cyTopo.ClabTopoData.ClabLinks {

		cytoJson.Group = "edges"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = strconv.Itoa(i)
		cytoJson.Data.Weight = "1"
		cytoJson.Data.Source = l.A.Node.ShortName
		cytoJson.Data.Endpoint.SourceEndpoint = l.A.EndpointName
		cytoJson.Data.Target = l.B.Node.ShortName
		cytoJson.Data.Endpoint.TargetEndpoint = l.B.EndpointName

		cytoJson.Data.ExtraData = map[string]interface{}{
			"ClabServerUsername": Username,
			"Kind":               "ClabLink",
			"grabbable":          true,
			"selectable":         true,
			"ID":                 strconv.Itoa(i),
			"weight":             "1",
			"SourceLongName":     l.A.Node.LongName,
			"TargetLongName":     l.B.Node.LongName,
			"Endpoints": struct {
				SourceEndpoint string
				TargetEndpoint string
			}{l.A.EndpointName, l.B.EndpointName},
		}

		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}
	// log.Info(cyTopo.Nodes)

	// jsonBytesCytoUi, err := json.MarshalIndent(CytoTopology{
	// 	Nodes: cyTopo.Nodes,
	// 	Links: cyTopo.Links}, "", "  ")
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }

	// _, err = os.Stdout.Write(jsonBytesCytoUi)
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }
	// log.Info("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	// jsonBytesCytoUi, err := json.MarshalIndent(CytoJsonTopology{
	// 	Element: cytoJsonArray}, "", "  ")

	jsonBytesCytoUi, err := json.MarshalIndent(cytoJsonArray, "", "  ")
	if err != nil {
		log.Error(err)
		panic(err)
	}

	_, err = os.Stdout.Write(jsonBytesCytoUi)
	if err != nil {
		log.Error(err)
		panic(err)
	}
	log.Info("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	return jsonBytesCytoUi
}

func (cyTopo *CytoTopology) PrintjsonBytesCytoUi(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+cyTopo.ClabTopoData.ClabTopoName, 0755)
	file, err := os.Create("html-public/" + cyTopo.ClabTopoData.ClabTopoName + "/dataCytoMarshall-" + cyTopo.ClabTopoData.ClabTopoName + ".json")
	if err != nil {
		log.Error("Could not create json file for graph")
	}

	// Write to file
	_, err = file.Write(marshaledJsonBytesCytoUi)
	if err != nil {
		log.Error("Could not write json to file")
	}
	return err
}
