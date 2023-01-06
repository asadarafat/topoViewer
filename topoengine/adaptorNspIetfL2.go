package topoengine

import (
	"encoding/json"
	"os"
	"os/user"
	"path"
	"strconv"

	log "github.com/sirupsen/logrus"

	tools "github.com/asadarafat/topoViewer/tools"
)

type IetfNetworkTopologyL2 struct {
	IetfNetworkNetwork []struct {
		NetworkID    string `json:"network-id"`
		NetworkTypes struct {
			IetfL2TopologyL2Topology struct {
			} `json:"ietf-l2-topology:l2-topology"`
		} `json:"network-types"`
		NodeList []struct {
			NodeID                              string `json:"node-id"`
			IetfNetworkTopologyTerminationPoint []struct {
				TpID                                              string `json:"tp-id"`
				IetfL3UnicastTopologyL3TerminationPointAttributes struct {
				} `json:"ietf-l3-unicast-topology:l3-termination-point-attributes"`
				IetfL2TopologyL2TerminationPointAttributes struct {
					InterfaceName                       string        `json:"interface-name"`
					MacAddress                          string        `json:"mac-address"`
					EncapsulationType                   string        `json:"encapsulation-type"`
					OuterTag                            interface{}   `json:"outer-tag"`
					OuterTpid                           interface{}   `json:"outer-tpid"`
					InnerTag                            interface{}   `json:"inner-tag"`
					InnerTpid                           interface{}   `json:"inner-tpid"`
					Lag                                 bool          `json:"lag"`
					PortNumber                          []interface{} `json:"port-number"`
					UnnumberedID                        []int         `json:"unnumbered-id"`
					MemberLinkTp                        []interface{} `json:"member-link-tp"`
					NspIetfNetworkTopologyNspAttributes []interface{} `json:"nsp-ietf-network-topology:nsp-attributes"`
				} `json:"ietf-l2-topology:l2-termination-point-attributes"`
			} `json:"ietf-network-topology:termination-point"`
			IetfL2TopologyL2NodeAttributes struct {
				Name              string        `json:"name"`
				ManagementMac     string        `json:"management-mac"`
				ManagementVlan    interface{}   `json:"management-vlan"`
				Flags             []interface{} `json:"flags"`
				BridgeID          []interface{} `json:"bridge-id"`
				ManagementAddress []string      `json:"management-address"`
			} `json:"ietf-l2-topology:l2-node-attributes"`
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
			IetfL2TopologyL2LinkAttributes struct {
				Name                                string   `json:"name"`
				Rate                                int      `json:"rate"`
				Delay                               int      `json:"delay"`
				AutoNego                            bool     `json:"auto-nego"`
				Duplex                              string   `json:"duplex"`
				Flags                               []string `json:"flags"`
				NspIetfNetworkTopologyNspAttributes []string `json:"nsp-ietf-network-topology:nsp-attributes"`
			} `json:"ietf-l2-topology:l2-link-attributes"`
		} `json:"ietf-network-topology:link"`
		IetfL2TopologyL2TopologyAttributes struct {
			Name  string        `json:"name"`
			Flags []interface{} `json:"flags"`
		} `json:"ietf-l2-topology:l2-topology-attributes"`
	} `json:"ietf-network:network"`
}

func (cyTopo *CytoTopology) InitLoggerIetfL2() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopologyIetfL2.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) IetfL2TopoRead(topoFile string) []byte {
	// log.Info(topoFile)

	filePath, _ := os.Getwd()
	filePath = path.Join(filePath, topoFile)

	log.Info("topology file path: ", filePath)
	topoFileBytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	cyTopo.IetfNetworL2TopoData = topoFileBytes
	return topoFileBytes
}

func (cyTopo *CytoTopology) IetfL2TopoUnMarshal(topoFile []byte, IetfNetworkTopologyL2Data IetfNetworkTopologyL2) []byte {
	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}

	Username := user.Username

	json.Unmarshal(topoFile, &IetfNetworkTopologyL2Data)
	// log.Info(IetfNetworkTopologyL2Data)

	cytoJson := CytoJson{}
	cytoJsonList := []CytoJson{}

	for i, network := range IetfNetworkTopologyL2Data.IetfNetworkNetwork {
		nodes := network.NodeList
		for j, node := range nodes {

			cytoJson.Group = "nodes"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = "L2-" + node.NodeID
			cytoJson.Data.Weight = "2"
			cytoJson.Data.Name = node.IetfL2TopologyL2NodeAttributes.Name

			cytoJson.Data.ExtraData = map[string]interface{}{
				"ServerUsername":       Username,
				"IetfL2NetworkName":    network.NetworkID,
				"IetfL2NetworkType":    network.NetworkTypes,
				"NetworkID":            strconv.Itoa(i),
				"NodeID":               node.NodeID,
				"Weight":               "2",
				"Name":                 node.NodeID,
				"NodeNumber":           j,
				"NodeAttributes":       node.IetfL2TopologyL2NodeAttributes,
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
			cytoJson.Data.ID = strconv.Itoa(k)
			cytoJson.Data.Weight = "1"
			cytoJson.Data.Source = "L2-" + link.Source.SourceNode[70:len(link.Source.SourceNode)-2]
			cytoJson.Data.Endpoint.SourceEndpoint = link.Source.SourceTp
			cytoJson.Data.Target = "L2-" + link.Destination.DestNode[70:len(link.Destination.DestNode)-2]
			cytoJson.Data.Endpoint.TargetEndpoint = link.Destination.DestTp

			cytoJson.Data.Name = link.LinkID

			cytoJson.Data.ExtraData = map[string]interface{}{
				"TopoviewerServerUsername": Username,
				"Kind":                     "edges",
				"grabbable":                true,
				"selectable":               true,
				"ID":                       strconv.Itoa(k),
				"weight":                   "1",
				"Name":                     link.IetfL2TopologyL2LinkAttributes.Name,
				"Rate":                     link.IetfL2TopologyL2LinkAttributes.Rate,
				"Delay":                    link.IetfL2TopologyL2LinkAttributes.Delay,
				"Auto-nego":                link.IetfL2TopologyL2LinkAttributes.AutoNego,
				"Duplex":                   link.IetfL2TopologyL2LinkAttributes.Duplex,
				"Flags":                    link.IetfL2TopologyL2LinkAttributes.Flags,
				"L2LinkAttributes":         link.IetfL2TopologyL2LinkAttributes,
				// "NspAttributes": link.IetfL2TopologyL2LinkAttributes.NspIetfNetworkTopologyNspAttributes,
				"Endpoints": struct {
					SourceEndpoint string
					TargetEndpoint string
				}{link.Source.SourceNode, link.Destination.DestNode},
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
		}
	}
	// Throw unmarshalled result to log
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
	// log.Info("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	return jsonBytesCytoUi
}

func (cyTopo *CytoTopology) IetfL2TopoPrintjsonBytesCytoUi(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+"IetfTopology-L2", 0755)
	file, err := os.Create("html-public/" + "IetfTopology-L2" + "/dataIetfL2TopoCytoMarshall.json")
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
