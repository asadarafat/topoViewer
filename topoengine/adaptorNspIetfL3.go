package topoengine

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"os/user"
	"path"
	"strconv"

	log "github.com/sirupsen/logrus"

	tools "github.com/asadarafat/topoViewer/tools"
)

type IetfNetworkTopologyL3 struct {
	IetfNetworkNetwork []struct {
		NetworkID    string `json:"network-id"`
		NetworkTypes struct {
			IetfL3UnicastTopologyL3UnicastTopology struct {
			} `json:"ietf-l3-unicast-topology:l3-unicast-topology"`
		} `json:"network-types"`
		SupportingNetwork []struct {
			NetworkRef string `json:"network-ref"`
		} `json:"supporting-network"`
		NodeList []struct {
			NodeID         string `json:"node-id"`
			SupportingNode []struct {
				NetworkRef string `json:"network-ref"`
				NodeRef    string `json:"node-ref"`
			} `json:"supporting-node"`
			IetfNetworkTopologyTerminationPoint []struct {
				TpID                       string `json:"tp-id"`
				SupportingTerminationPoint []struct {
					NetworkRef string `json:"network-ref"`
					NodeRef    string `json:"node-ref"`
					TpRef      string `json:"tp-ref"`
				} `json:"supporting-termination-point"`
				IetfL3UnicastTopologyL3TerminationPointAttributes struct {
					IPAddress []string `json:"ip-address"`
				} `json:"ietf-l3-unicast-topology:l3-termination-point-attributes"`
			} `json:"ietf-network-topology:termination-point"`
			IetfL3UnicastTopologyL3NodeAttributes struct {
				Name                                string        `json:"name"`
				Flag                                []string      `json:"flag"`
				RouterID                            []string      `json:"router-id"`
				NspIetfNetworkTopologyNspAttributes []interface{} `json:"nsp-ietf-network-topology:nsp-attributes"`
				Prefix                              []struct {
					Prefix string        `json:"prefix"`
					Metric int           `json:"metric"`
					Flag   []interface{} `json:"flag"`
				} `json:"prefix"`
			} `json:"ietf-l3-unicast-topology:l3-node-attributes"`
		} `json:"node"`
		LinkList []struct {
			LinkID string `json:"link-id"`
			Source struct {
				SourceNode string `json:"source-node"`
				SourceTp   string `json:"source-tp"`
			} `json:"source"`
			Destination struct {
				DestNode string `json:"dest-node"`
				DestTp   string `json:"dest-tp"`
			} `json:"destination"`
			IetfL3UnicastTopologyL3LinkAttributes struct {
				Name                                string        `json:"name"`
				Metric1                             int           `json:"metric1"`
				Metric2                             int           `json:"metric2"`
				Flag                                []string      `json:"flag"`
				NspIetfNetworkTopologyNspAttributes []interface{} `json:"nsp-ietf-network-topology:nsp-attributes"`
			} `json:"ietf-l3-unicast-topology:l3-link-attributes"`
			SupportingLink []struct {
				NetworkRef string `json:"network-ref"`
				LinkRef    string `json:"link-ref"`
			} `json:"supporting-link,omitempty"`
		} `json:"ietf-network-topology:link"`
		IetfL3UnicastTopologyL3TopologyAttributes struct {
			Name string        `json:"name"`
			Flag []interface{} `json:"flag"`
		} `json:"ietf-l3-unicast-topology:l3-topology-attributes"`
	} `json:"ietf-network:network"`
}

func (cyTopo *CytoTopology) InitLoggerIetfL3() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopologyIetfL3.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) IetfL3TopoMarshal(topoFile string) {
	log.Info(topoFile)

	filePath, _ := os.Getwd()
	filePath = path.Join(filePath, topoFile)

	log.Info("topology file path: ", filePath)
	topoFileBytes, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	cyTopo.IetfNetworL3TopoData = topoFileBytes
}

func (cyTopo *CytoTopology) IetfL3TopoUnMarshal(topoFile []byte, IetfNetworkTopologyL3Data IetfNetworkTopologyL3) []byte {
	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}

	Username := user.Username

	json.Unmarshal(topoFile, &IetfNetworkTopologyL3Data)
	// log.Info(IetfNetworkTopologyL3Data)

	cytoJson := CytoJson{}
	cytoJsonList := []CytoJson{}

	for i, network := range IetfNetworkTopologyL3Data.IetfNetworkNetwork {
		nodes := network.NodeList
		for j, node := range nodes {

			cytoJson.Group = "nodes"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = "L3-" + node.NodeID
			cytoJson.Data.Weight = "3"
			cytoJson.Data.Name = node.IetfL3UnicastTopologyL3NodeAttributes.Name

			cytoJson.Data.ExtraData = map[string]interface{}{
				"ServerUsername":       Username,
				"IetfL3NetworkName":    network.NetworkID,
				"NetworkID":            strconv.Itoa(i),
				"NodeID":               node.NodeID,
				"Weight":               "3",
				"Name":                 node.IetfL3UnicastTopologyL3NodeAttributes.Name,
				"NodeNumber":           j,
				"NodeAttributes":       node.IetfL3UnicastTopologyL3NodeAttributes,
				"NodeTerminationPoins": node.IetfNetworkTopologyTerminationPoint,
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
			// log.Info(j)
		}
		links := network.LinkList
		for k, link := range links {
			cytoJson.Group = "edges"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = strconv.Itoa(k + 3000)
			cytoJson.Data.Weight = "1"
			cytoJson.Data.Source = "L3-" + link.Source.SourceNode[85:len(link.Source.SourceNode)-2]
			cytoJson.Data.Endpoint.SourceEndpoint = link.Source.SourceTp
			cytoJson.Data.Target = "L3-" + link.Destination.DestNode[85:len(link.Destination.DestNode)-2]
			cytoJson.Data.Endpoint.TargetEndpoint = link.Destination.DestTp

			cytoJson.Data.Name = link.LinkID

			cytoJson.Data.ExtraData = map[string]interface{}{
				"ClabServerUsername": Username,
				"Kind":               "edges",
				"grabbable":          true,
				"selectable":         true,
				"ID":                 strconv.Itoa(k),
				"weight":             "1",
				"Name":               link.LinkID,
				"L3LinkAttributes":   link.IetfL3UnicastTopologyL3LinkAttributes,
				"Endpoints": struct {
					SourceEndpoint string
					TargetEndpoint string
				}{link.Source.SourceNode, link.Destination.DestNode},
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
		}
	}
	// log.Info(cytoJsonList)

	jsonBytesCytoUi, err := json.MarshalIndent(cytoJsonList, "", "  ")
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

func (cyTopo *CytoTopology) IetfL3TopoPrintjsonBytesCytoUi(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+"IetfTopology-L3", 0755)
	file, err := os.Create("html-public/" + "IetfTopology-L3" + "/dataIetfL3TopoCytoMarshall.json")
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
