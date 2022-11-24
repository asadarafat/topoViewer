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

type IetfNetworkTopologyMultiL2L3 struct {
	TopologyL2 IetfNetworkTopologyL2
	TopologyL3 IetfNetworkTopologyL3
}

func (cyTopo *CytoTopology) InitLoggerIetfMultiL2L3() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopologyIetfMultiL2L3.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) IetfMultiL2L3TopoRead(topoFile string) []byte {
	// log.Info(topoFile)

	filePath, _ := os.Getwd()
	filePath = path.Join(filePath, topoFile)

	log.Info("topology file path: ", filePath)
	topoFileBytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	return topoFileBytes
}

func (cyTopo *CytoTopology) IetfMultiL2L3TopoUnMarshal(L2topoFile []byte, L3topoFile [][]byte, IetfNetworkTopologyMultiL2L3Data IetfNetworkTopologyMultiL2L3) []byte {
	// get TopoViewer ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}

	Username := user.Username
	cytoJson := CytoJson{}
	cytoJsonList := []CytoJson{}

	// unMarshall L3 Topo
	for h := range L3topoFile {
		json.Unmarshal(L3topoFile[h], &IetfNetworkTopologyMultiL2L3Data.TopologyL3)

		for i, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
			nodes := network.NodeList
			for j, node := range nodes {

				cytoJson.Group = "nodes"
				cytoJson.Grabbable = true
				cytoJson.Selectable = true
				cytoJson.Data.ID = "L3-" + node.NodeID
				cytoJson.Data.Weight = "3"
				cytoJson.Data.Name = "L3-" + node.IetfL3UnicastTopologyL3NodeAttributes.Name

				cytoJson.Data.ExtraData = map[string]interface{}{
					"ServerUsername":           Username,
					"IetfMultiL2L3NetworkName": network.NetworkID,
					"NetworkID":                strconv.Itoa(i),
					"NodeID":                   node.NodeID,
					"Weight":                   "3",
					"Name":                     node.IetfL3UnicastTopologyL3NodeAttributes.Name,
					"NodeNumber":               j,
					"NodeAttributes":           node.IetfL3UnicastTopologyL3NodeAttributes,
					"NodeTerminationPoins":     node.IetfNetworkTopologyTerminationPoint,
				}
				cytoJsonList = append(cytoJsonList, cytoJson)

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
					"ClabServerUsername":      Username,
					"Kind":                    "edges",
					"grabbable":               true,
					"selectable":              true,
					"ID":                      strconv.Itoa(k),
					"weight":                  "1",
					"Name":                    link.LinkID,
					"MultiL2L3LinkAttributes": link.IetfL3UnicastTopologyL3LinkAttributes,
					"Endpoints": struct {
						SourceEndpoint string
						TargetEndpoint string
					}{link.Source.SourceNode, link.Destination.DestNode},
				}
				cytoJsonList = append(cytoJsonList, cytoJson)
			}
		}
	}

	// unMarshall L2 Topo
	json.Unmarshal(L2topoFile, &IetfNetworkTopologyMultiL2L3Data.TopologyL2)
	for ii, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL2.IetfNetworkNetwork {
		nodes := network.NodeList
		for jj, node := range nodes {

			cytoJson.Group = "nodes"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = "L2-" + node.NodeID
			cytoJson.Data.Weight = "2"
			cytoJson.Data.Name = "L2-" + node.IetfL2TopologyL2NodeAttributes.Name

			cytoJson.Data.ExtraData = map[string]interface{}{
				"ServerUsername":       Username,
				"IetfL2NetworkName":    network.NetworkID,
				"IetfL2NetworkType":    network.NetworkTypes,
				"NetworkID":            strconv.Itoa(ii),
				"NodeID":               node.NodeID,
				"Weight":               "2",
				"Name":                 node.NodeID,
				"NodeNumber":           jj,
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

	// // add Linkage between L2 and L3 Nodes
	// for hh := range L3topoFile {
	// 	json.Unmarshal(L3topoFile[hh], &IetfNetworkTopologyMultiL2L3Data.TopologyL3)

	// 	for ii, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
	// 		nodes := network.NodeList
	// 		for jj, node := range nodes {
	// 			for kk, NodeTerminationPoins := range node.IetfNetworkTopologyTerminationPoint {
	// 				cytoJson.Group = "edges"
	// 				cytoJson.Grabbable = true
	// 				cytoJson.Selectable = true
	// 				cytoJson.Data.ID = strconv.Itoa(jj + 100)
	// 				cytoJson.Data.Weight = "1"
	// 				cytoJson.Data.Source = "L3-" + node.NodeID
	// 				cytoJson.Data.Endpoint.SourceEndpoint = NodeTerminationPoins.TpID
	// 				cytoJson.Data.Target = "L2-" + node.NodeID
	// 				cytoJson.Data.Endpoint.TargetEndpoint = NodeTerminationPoins.TpID
	// 				cytoJson.Data.Name = "L2-L3"
	// 				cytoJson.Data.ExtraData = map[string]interface{}{
	// 					"ClabServerUsername": Username,
	// 					"NetworkID":          ii,
	// 					"Kind":               "edges",
	// 					"grabbable":          true,
	// 					"selectable":         true,
	// 					"ID":                 strconv.Itoa(kk),
	// 					"weight":             "1",
	// 					"Endpoints": struct {
	// 						SourceEndpoint string
	// 						TargetEndpoint string
	// 					}{"L3-" + node.NodeID, "L2-" + node.NodeID},
	// 				}
	// 				cytoJsonList = append(cytoJsonList, cytoJson)
	// 			}
	// 		}
	// 	}
	// }

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

func (cyTopo *CytoTopology) IetfMultiL2L3TopoPrintjsonBytesCytoUi(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+"IetfTopology-MultiL2L3", 0755)
	file, err := os.Create("html-public/" + "IetfTopology-MultiL2L3" + "/dataIetfMultiL2L3TopoCytoMarshall.json")
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
