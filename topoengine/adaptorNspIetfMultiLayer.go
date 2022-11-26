package topoengine

import (
	"encoding/json"
	"os"
	"os/user"
	"path"
	"strconv"

	tools "github.com/asadarafat/topoViewer/tools"
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

func (cyTopo *CytoTopology) IetfMultiL2L3TopoRead(topoFileL2 string, topoFileL3 []string) {
	filePathL2, _ := os.Getwd()
	filePathL2 = path.Join(filePathL2, topoFileL2)

	log.Info("topology file path: ", filePathL2)
	topoFileBytesL2, err := os.ReadFile(filePathL2)
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	cyTopo.IetfNetworL2TopoData = topoFileBytesL2
	log.Debug("Code Trace #############")

	var topoL3FileByteCombine [][]byte
	topoL3FileByteCombine = append(topoL3FileByteCombine, cyTopo.IetfL3TopoRead(topoFileL3[0]))
	topoL3FileByteCombine = append(topoL3FileByteCombine, cyTopo.IetfL3TopoRead(topoFileL3[1]))
	topoL3FileByteCombine = append(topoL3FileByteCombine, cyTopo.IetfL3TopoRead(topoFileL3[2]))

	cyTopo.IetfNetworL3TopoData = topoL3FileByteCombine
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

	// unMarshall L3 Topo - Nodes
	// unMarshall L3 Topo - Nodes
	for h := range L3topoFile {
		json.Unmarshal(L3topoFile[h], &IetfNetworkTopologyMultiL2L3Data.TopologyL3)
		for i, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
			nodes := network.NodeList
			for j, node := range nodes {
				cytoJson.Group = "nodes"
				cytoJson.Grabbable = true
				cytoJson.Selectable = true
				cytoJson.Data.ID = "L3-" + node.NodeID //taken by cyto as index
				// cytoJson.Data.ID = "L3-" + network.NetworkID + "-" + node.NodeID //taken by cyto as index
				cytoJson.Data.Weight = "3"
				// cytoJson.Data.Name = "L3-" + node.IetfL3UnicastTopologyL3NodeAttributes.Name + "-" + network.NetworkID
				cytoJson.Data.Name = node.IetfL3UnicastTopologyL3NodeAttributes.Name

				cytoJson.Data.Parent = "L3--" + network.NetworkID

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
			// add Parent Nodes Per Network ID
			cytoJson.Group = "nodes"
			cytoJson.Grabbable = true
			cytoJson.Selectable = true
			cytoJson.Data.ID = "L3--" + network.NetworkID //taken by cyto as index
			cytoJson.Data.Weight = "3"
			cytoJson.Data.Name = cytoJson.Data.ID
			cytoJson.Data.Parent = "Layer-3"
			cytoJsonList = append(cytoJsonList, cytoJson)
		}
		// add Parent Node For Layer 3
		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = "Layer-3" //taken by cyto as index
		cytoJson.Data.Weight = "3"
		cytoJson.Data.Name = cytoJson.Data.ID
		cytoJsonList = append(cytoJsonList, cytoJson)
	}

	// unMarshall L3 Topo - Links
	// unMarshall L3 Topo - Links
	for hh := range L3topoFile {
		json.Unmarshal(L3topoFile[hh], &IetfNetworkTopologyMultiL2L3Data.TopologyL3)
		for ii, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
			links := network.LinkList
			for k, link := range links {
				cytoJson.Group = "edges"
				cytoJson.Grabbable = true
				cytoJson.Selectable = true
				cytoJson.Data.ID = strconv.Itoa(hh+100) + strconv.Itoa(k+100)
				cytoJson.Data.Weight = "1"
				// cytoJson.Data.Source = "L3-" + network.NetworkID + "-" + link.Source.SourceNode[85:len(link.Source.SourceNode)-2]
				cytoJson.Data.Source = "L3-" + link.Source.SourceNode[85:len(link.Source.SourceNode)-2]
				cytoJson.Data.Endpoint.SourceEndpoint = link.Source.SourceTp

				// cytoJson.Data.Target = "L3-" + network.NetworkID + "-" + link.Destination.DestNode[85:len(link.Destination.DestNode)-2]
				cytoJson.Data.Target = "L3-" + link.Destination.DestNode[85:len(link.Destination.DestNode)-2]
				cytoJson.Data.Endpoint.TargetEndpoint = link.Destination.DestTp
				cytoJson.Data.Name = link.LinkID

				cytoJson.Data.Kind = "Layer3Link"

				cytoJson.Data.ExtraData = map[string]interface{}{
					"ClabServerUsername":      Username,
					"grabbable":               true,
					"selectable":              true,
					"ID":                      strconv.Itoa(k),
					"NetworkID":               strconv.Itoa(ii),
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

			cytoJson.Data.Parent = "Layer-2"

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

			cytoJson.Data.Kind = "Layer2Link"

			cytoJson.Data.ExtraData = map[string]interface{}{
				"TopoviewerServerUsername": Username,
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
		// add Parent Nodes Per Layer
		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = "Layer-2" //taken by cyto as index
		cytoJson.Data.Weight = "3"
		cytoJson.Data.Name = cytoJson.Data.ID
		cytoJsonList = append(cytoJsonList, cytoJson)
	}

	// add Linkage between L2 and L3 Nodes
	for hh := range L3topoFile {
		json.Unmarshal(L3topoFile[hh], &IetfNetworkTopologyMultiL2L3Data.TopologyL3)

		for ii, network := range IetfNetworkTopologyMultiL2L3Data.TopologyL3.IetfNetworkNetwork {
			nodes := network.NodeList
			for jj, node := range nodes {
				// for kk, NodeTerminationPoins := range node.IetfNetworkTopologyTerminationPoint {
				cytoJson.Group = "edges"
				cytoJson.Grabbable = true
				cytoJson.Selectable = true
				cytoJson.Data.ID = uuid.NewString()

				cytoJson.Data.Weight = "1"
				cytoJson.Data.Source = "L3-" + node.NodeID
				// cytoJson.Data.Endpoint.SourceEndpoint = NodeTerminationPoins.TpID
				cytoJson.Data.Target = "L2-" + node.NodeID
				// cytoJson.Data.Endpoint.TargetEndpoint = NodeTerminationPoins.TpID
				cytoJson.Data.Name = "MultiLayer--" + cytoJson.Data.Source + "---" + cytoJson.Data.Target

				cytoJson.Data.Kind = "MultiLayerLink"

				cytoJson.Data.ExtraData = map[string]interface{}{
					"ClabServerUsername": Username,
					"NetworkID":          ii,
					"grabbable":          true,
					"selectable":         true,
					"ID":                 cytoJson.Data.ID,
					"weight":             "1",

					"Endpoints": struct {
						SourceEndpoint string
						TargetEndpoint string
					}{"L3-" + node.NodeID, "L2-" + node.NodeID},
				}
				cytoJsonList = append(cytoJsonList, cytoJson)
				log.Debug(jj)
				// }
			}
		}
	}

	// Throw unmarshalled result to log
	// log.Debug("cytoJsonList: ", cytoJsonList)
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
	// log.Debug("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))
	return jsonBytesCytoUi
}

func (cyTopo *CytoTopology) IetfMultiLayerTopoPrintjsonBytesCytoUi(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+"IetfTopology-MultiLayer", 0755)
	file, err := os.Create("html-public/" + "IetfTopology-MultiLayer" + "/dataIetfMultiLayerTopoCytoMarshall.json")
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
