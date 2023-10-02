package topoengine

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"strconv"
	"strings"

	tools "github.com/asadarafat/topoViewer/go_tools"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

type IetfNetworkTopologyMultiL2L3 struct {
	TopologyL2 IetfNetworkTopologyL2
	TopologyL3 IetfNetworkTopologyL3
}

func (cyTopo *CytoTopology) InitLoggerIetfMultiL2L3() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopologyIetfMultiLayer.log", cyTopo.LogLevel)
}

// Multi Topo Function
func (cyTopo *CytoTopology) IetfMultiL2L3TopoReadV2(topoFile string) []byte {
	filePath, _ := os.Getwd()
	filePath = (filePath + "/rawTopoFile/ietf-topo-examples/")
	log.Info("topology file path: ", filePath)
	topoFileBytes, err := ioutil.ReadFile(filePath + "ietf-all-networks.json")

	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	return topoFileBytes
}

func (cyTopo *CytoTopology) IetfMultiL2L3TopoUnMarshalV2(topoFile []byte, IetfNetworkTopologyMultiL2L3Data IetfNetworkTopologyMultiL2L3) []CytoJson {

	var payload map[string]interface{}
	var extractedDataSap []map[string]interface{} // Store extracted data here
	var extractedDataL2 []map[string]interface{}  // Store extracted data here
	var extractedDataL3 []map[string]interface{}  // Store extracted data here

	err := json.Unmarshal(topoFile, &payload)
	if err != nil {
		log.Error("Error:", err)
	}

	networks, networkExists := payload["ietf-network:networks"]
	if !networkExists {
		log.Error("No networks found in payload")
	}

	networkList := networks.(map[string]interface{})["network"].([]interface{})
	for _, network := range networkList {
		networkData := network.(map[string]interface{})

		networkTypes, typesExist := networkData["network-types"]
		if !typesExist {
			continue // Skip if no network-types
		}

		networkTypeMap := networkTypes.(map[string]interface{})
		for key := range networkTypeMap {
			if strings.Contains(key, "ietf-sap-ntw:sap-network") {
				// Extract data related to "ietf-sap-ntw:sap-network"
				extractedDataSap = append(extractedDataSap, networkData)
				break
			}
			if strings.Contains(key, "ietf-l2-topology:l2-topology") {
				// Extract data related to "ietf-l2-topology:l2-topology"
				extractedDataL2 = append(extractedDataL2, networkData)
				break
			}
			if strings.Contains(key, "ietf-l3-unicast-topology:l3-unicast-topology") {
				// Extract data related to "ietf-l3-unicast-topology:l3-unicast-topology"
				extractedDataL3 = append(extractedDataL3, networkData)

				break
			}

		}
	}

	// // Marshal the extracted SAP Topo data to JSON, add "ietf-network:network" header in JSON Output
	// outputExtractedDataSap := map[string][]map[string]interface{}{
	// 	"ietf-network:network": extractedDataSap,
	// }
	// outputextractedDataJsonSap, err := json.MarshalIndent(outputExtractedDataSap, "", "    ")
	// if err != nil {
	// 	log.Info("Error encoding JSON:", err)
	// }

	// Marshal the extracted L2 Topo data to JSON, add "ietf-network:network" header in JSON Output
	outputExtractedDataL2 := map[string][]map[string]interface{}{
		"ietf-network:network": extractedDataL2,
	}
	outputextractedDataJsonL2, err := json.MarshalIndent(outputExtractedDataL2, "", "    ")
	if err != nil {
		log.Info("Error encoding JSON:", err)
	}

	// Marshal the extracted L3 Topo data to JSON, add "ietf-network:network" header in JSON Output
	outputExtractedDataL3 := map[string][]map[string]interface{}{
		"ietf-network:network": extractedDataL3,
	}
	outputextractedDataJsonL3, err := json.MarshalIndent(outputExtractedDataL3, "", "    ")
	if err != nil {
		log.Info("Error encoding JSON:", err)
	}

	// Create Cyto JSON
	// Create Cyto JSON
	cytoJson := CytoJson{}
	cytoJsonList := []CytoJson{}

	// Create Cyto JSON L2 TOPO
	// Create Cyto JSON L2 TOPO
	json.Unmarshal(outputextractedDataJsonL2, &IetfNetworkTopologyMultiL2L3Data.TopologyL2)
	for ii, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL2.IetfNetworkNetwork {
		nodes := network.NodeList
		for jj, node := range nodes {

			cytoJson.Group = "nodes"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = "L2-" + node.NodeID
			cytoJson.Data.Weight = "2"
			cytoJson.Data.Name = node.IetfL2TopologyL2NodeAttributes.Name
			cytoJson.Data.Parent = "ietf-l2-topology"
			cytoJson.Data.Kind = "layer2Node"
			cytoJson.Data.TopoviewerRole = ""
			cytoJson.Data.ExtraData = map[string]interface{}{
				"networkName":          "ietf-l2-topology",
				"networkType":          network.NetworkTypes,
				"networkID":            strconv.Itoa(ii),
				"nodeID":               node.NodeID,
				"weight":               "2",
				"nodeNumber":           jj,
				"nodeAttributes":       node.IetfL2TopologyL2NodeAttributes,
				"nodeTerminationPoins": node.IetfNetworkTopologyTerminationPoint,
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
			// log.Info(j)
		}
		links := network.LinkList
		for k, link := range links {
			cytoJson.Group = "edges"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = uuid.NewString()
			cytoJson.Data.Weight = "1"
			cytoJson.Data.Source = "L2-" + link.Source.SourceNode[70:len(link.Source.SourceNode)-2]
			// cytoJson.Data.Endpoint.SourceEndpoint = link.Source.SourceTp
			cytoJson.Data.SourceEndpoint = link.Source.SourceTp

			cytoJson.Data.Target = "L2-" + link.Destination.DestNode[70:len(link.Destination.DestNode)-2]
			// cytoJson.Data.Endpoint.TargetEndpoint = link.Destination.DestTp
			cytoJson.Data.TargetEndpoint = link.Destination.DestTp
			cytoJson.Data.Name = link.LinkID
			cytoJson.Data.Kind = "layer2Link"

			cytoJson.Data.ExtraData = map[string]interface{}{
				"networkName":      "ietf-l2-topology",
				"id":               strconv.Itoa(k),
				"weight":           "1",
				"l2LinkAttributes": link.IetfL2TopologyL2LinkAttributes,
				"nspAttributes":    link.IetfL2TopologyL2LinkAttributes.NspIetfNetworkTopologyNspAttributes,
				"endpoints": struct {
					SourceEndpoint string
					TargetEndpoint string
				}{link.Source.SourceNode,
					link.Destination.DestNode,
				},
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
		}
		// add Parent Nodes Per Layer
		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = "ietf-l2-topology" //taken by cyto as index
		cytoJson.Data.Weight = "3"
		cytoJson.Data.Name = cytoJson.Data.ID
		cytoJson.Data.TopoviewerRole = "parent-l2"
		cytoJson.Data.ExtraData = map[string]interface{}{
			"nodeAttributes": struct {
				Name string
			}{"ietf-l2-topology"},
		}
		cytoJsonList = append(cytoJsonList, cytoJson)
	}

	// Create Cyto JSON L3 TOPO
	// Create Cyto JSON L3 TOPO
	json.Unmarshal(outputextractedDataJsonL3, &IetfNetworkTopologyMultiL2L3Data.TopologyL3)
	for i, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
		nodes := network.NodeList
		for j, node := range nodes {
			cytoJson.Group = "nodes"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = "L3-" + node.NodeID + "--" + network.NetworkID //taken by cyto as index
			cytoJson.Data.Weight = "3"
			cytoJson.Data.Name = node.IetfL3UnicastTopologyL3NodeAttributes.Name
			cytoJson.Data.Parent = "L3--" + network.NetworkID
			cytoJson.Data.Kind = "layer3Node"
			cytoJson.Data.TopoviewerRole = ""
			cytoJson.Data.ExtraData = map[string]interface{}{
				"networkName":          "ietf-l3-unicast-topology",
				"networkType":          network.NetworkTypes,
				"networkID":            strconv.Itoa(i),
				"nodeID":               node.NodeID,
				"weight":               "3",
				"nodeNumber":           j,
				"nodeAttributes":       node.IetfL3UnicastTopologyL3NodeAttributes,
				"nodeTerminationPoins": node.IetfNetworkTopologyTerminationPoint,
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
		}
		links := network.LinkList
		for _, link := range links {
			cytoJson.Group = "edges"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = uuid.NewString()
			cytoJson.Data.Weight = "1"
			cytoJson.Data.Source = "L3-" + link.Source.SourceNode[85:len(link.Source.SourceNode)-2] + "--" + network.NetworkID
			cytoJson.Data.SourceEndpoint = link.Source.SourceTp
			cytoJson.Data.Target = "L3-" + link.Destination.DestNode[85:len(link.Destination.DestNode)-2] + "--" + network.NetworkID
			cytoJson.Data.TargetEndpoint = link.Destination.DestTp
			cytoJson.Data.Name = link.LinkID
			cytoJson.Data.Kind = "layer3Link"

			cytoJson.Data.ExtraData = map[string]interface{}{
				"networkName":      "ietf-l3-unicast-topology",
				"l3LinkAttributes": link.IetfL3UnicastTopologyL3LinkAttributes,
				"endpoints": struct {
					SourceEndpoint string
					TargetEndpoint string
				}{link.Source.SourceNode, link.Destination.DestNode},
			}
			cytoJsonList = append(cytoJsonList, cytoJson)
		}

		// add Parent Nodes Per Network ID
		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = "L3--" + network.NetworkID //taken by cyto as index
		cytoJson.Data.Weight = "3"
		cytoJson.Data.Name = "L3--" + network.NetworkID
		cytoJson.Data.Parent = "ietf-l3-unicast-topology"
		cytoJson.Data.TopoviewerRole = "parent"
		cytoJson.Data.ExtraData = map[string]interface{}{
			"nodeAttributes": struct {
				name string
			}{network.NetworkID},
		}
		cytoJsonList = append(cytoJsonList, cytoJson)
	}

	// add Parent Node For Layer 3
	cytoJson.Group = "nodes"
	cytoJson.Grabbable = true
	cytoJson.Selectable = true
	cytoJson.Data.ID = "ietf-l3-unicast-topology" //taken by cyto as index
	cytoJson.Data.Weight = "3"
	cytoJson.Data.Name = cytoJson.Data.ID
	cytoJson.Data.TopoviewerRole = "parent"
	cytoJson.Data.ExtraData = map[string]interface{}{
		"nodeAttributes": struct {
			name string
		}{"ietf-l3-unicast-topology"},
	}
	cytoJsonList = append(cytoJsonList, cytoJson)

	// add Linkage between L2 and L3 Nodes
	for ii, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
		nodes := network.NodeList
		for _, node := range nodes {
			// for kk, NodeTerminationPoins := range node.IetfNetworkTopologyTerminationPoint {
			cytoJson.Group = "edges"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = uuid.NewString()
			cytoJson.Data.Weight = "1"
			cytoJson.Data.Source = "L3-" + node.NodeID + "--" + network.NetworkID
			cytoJson.Data.Target = "L2-" + node.NodeID
			cytoJson.Data.Name = "MultiLayer--" + cytoJson.Data.Source + "---" + cytoJson.Data.Target
			cytoJson.Data.Kind = "MultiLayerLink"
			cytoJson.Data.ExtraData = map[string]interface{}{
				"networkID": ii,
				"endpoints": struct {
					SourceEndpoint string
					TargetEndpoint string
				}{"L3-" + node.NodeID, "L2-" + node.NodeID},
			}
			cytoJsonList = append(cytoJsonList, cytoJson)

		}
	}
	return cytoJsonList
}

func (cyTopo *CytoTopology) IetfMultiLayerTopoPrintjsonBytesCytoUiV2(marshaledJsonBytesCytoUiL2Topo []byte) error {
	// Create file
	os.Mkdir("./html-public/"+"IetfTopology-MultiLayer", 0755)
	file, err := os.Create("html-public/" + "IetfTopology-MultiLayer" + "/IetfTopology-MultiLayer" + ".json")
	if err != nil {
		log.Error("Could not create json file for graph")
	}

	// Write to file
	_, err = file.Write(marshaledJsonBytesCytoUiL2Topo)
	if err != nil {
		log.Error("Could not write json to file")
	}
	// _, err = file.Write(marshaledJsonBytesCytoUiL3Topo)
	// if err != nil {
	// 	log.Error("Could not write json to file")
	// }
	return err
}
