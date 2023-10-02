package topoengine

import (
	"encoding/json"
	"os"
	"strconv"
	"strings"
	"text/template"

	log "github.com/sirupsen/logrus"
	types "github.com/srl-labs/containerlab/types"

	tools "github.com/asadarafat/topoViewer/go_tools"
)

// Containerlab Struct
type DigitalTwin struct {
	Name string `yaml:"name"`
	Mgmt struct {
		Ipv4Subnet string `yaml:"ipv4_subnet"`
	} `yaml:"mgmt"`
	Topology struct {
		Nodes []DigitalTwinNode `yaml:"nodes"`
		// Links []DigitalTwinLink `yaml:"links"`
		Links []struct {
			Endpoints string `yaml:"endpoints"`
		} `yaml:"links"`
	} `yaml:"topology"`
}

type DigitalTwinNode struct {
	Name     string `yaml:"name"`
	Kind     string `yaml:"kind"`
	MgmtIpv4 string `yaml:"mgmt_ipv4"`
	Group    string `yaml:"group"`
	Image    string `yaml:"image"`
	Type     string `yaml:"type"`
	License  string `yaml:"license"`
	// Extra Fields
	ExtraData interface{} `json:"ExtraData,omitempty"`
}

type DigitalTwinLink struct {
	Endpoints string `yaml:"endpoints"`
}

// aarafat-tag: currently the code working such that the topology from NSP IETF unmarshalled directly to DigitalTwinModel
// aarafat-tag: code need to be refactor, such that the topology from NSP IETF shall be unmarshalled to CytoScapeModel before loaded to DigitalTwinModel

func (cyTopo *CytoTopology) InitLoggerDigitalTwin() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-nspDigitalTwin.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) NspDigitalTwinReadTopo(ietfL2TopoFile string) []byte {
	return cyTopo.IetfL2TopoRead(ietfL2TopoFile)
}

func (cyTopo *CytoTopology) NspDigitalTwinTopoUnmarshal_usingClabMapMethod(topoFile []byte, IetfNetworkTopologyL2Data IetfNetworkTopologyL2) {
	json.Unmarshal(topoFile, &IetfNetworkTopologyL2Data)

	//init ClabTopo Struct
	ClabTopo := ClabTopo{}

	// initialise memory for map of nodeName to nodeDefinition relation
	var m = make(map[string]*types.NodeDefinition)
	var clabNodeAttributes = types.NodeDefinition{}

	var l = make(map[int]*types.Link)
	var clabLinkAttributes = types.Link{}

	var endpointA = make(map[int]*types.Endpoint)
	var clabEndpointA = types.Endpoint{}

	var endpointB = make(map[int]*types.Endpoint)
	var clabEndpointB = types.Endpoint{}

	for i, network := range IetfNetworkTopologyL2Data.IetfNetworkNetwork {
		nodes := network.NodeList
		for j, node := range nodes {

			clabNodeAttributes.Kind = "vr-sros"
			clabNodeAttributes.Image = "registry.srlinux.dev/pub/vr-sros:22.7.R1"
			clabNodeAttributes.Group = "sros"
			clabNodeAttributes.MgmtIPv4 = "30.30." + strconv.Itoa(i) + "." + strconv.Itoa(j)
			clabNodeAttributes.Type = "cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=4 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28"

			// add new key to map-clabNodeAttribute
			m[node.NodeID] = &clabNodeAttributes
			// log.Debug(node.NodeID)
		}
		ClabTopo.ClabNodeDefinition = m

		links := network.LinkList
		for k, link := range links {

			clabEndpointA.EndpointName = link.Source.SourceNode + " port: " + link.Source.SourceTp
			endpointA[k] = &clabEndpointA
			clabLinkAttributes.A = endpointA[k]

			clabEndpointB.EndpointName = link.Source.SourceNode + " port: " + link.Destination.DestTp
			endpointB[k] = &clabEndpointB
			clabLinkAttributes.B = endpointB[k]

			//add new key to map-clabLinkAttribute
			l[k] = &clabLinkAttributes
		}
		ClabTopo.ClabLinks = l
	}

	// load map of (nodeName to nodeDefinition relation) to ClabTopo.NodeDefinition
	log.Debug(ClabTopo.ClabNodeDefinition["10.10.10.2"].Kind)
	log.Debug("ClabLink: ")
	log.Debug("ClabLink: ")
	log.Debug("ClabLink: ", ClabTopo.ClabLinks[0].A)
	log.Debug("ClabLink: ", ClabTopo.ClabLinks[0].B)

	// log.Debug(ClabTopo.ClabLinks)
}

func (cyTopo *CytoTopology) NspDigitalTwinTopoUnmarshal(topoFile []byte, IetfNetworkTopologyL2Data IetfNetworkTopologyL2) {
	json.Unmarshal(topoFile, &IetfNetworkTopologyL2Data)

	//init ClabTopo Struct
	digitalTwinData := DigitalTwin{}
	digitalTwinNode := DigitalTwinNode{}
	digitalTwinLink := DigitalTwinLink{}

	digitalTwinData.Name = "asad"
	digitalTwinData.Mgmt.Ipv4Subnet = "30.30.0.0/16"

	for i, network := range IetfNetworkTopologyL2Data.IetfNetworkNetwork {
		nodes := network.NodeList
		for j, node := range nodes {
			// aarafat-tag: Node type need to be learn dynamically from NSP restconf
			// aarafat-tag: License file shall not be hardcoded, need to be passed as parameter
			// aarafat-tag: MgmtIpv4 is set automatically by CLAB
			// aarafat-tag: node-config shall not be hardcoded, need to be learn dynamically from NSP restconf

			digitalTwinNode.Name = node.IetfL2TopologyL2NodeAttributes.Name
			digitalTwinNode.Kind = "vr-sros"
			digitalTwinNode.MgmtIpv4 = "30.30." + strconv.Itoa(i+1) + "." + strconv.Itoa(j+1)
			digitalTwinNode.Group = "sros"
			digitalTwinNode.Image = "registry.srlinux.dev/pub/vr-sros:22.7.R1"
			digitalTwinNode.License = "license.txt"
			digitalTwinNode.Type = "\"cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=6 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28\""
			digitalTwinData.Topology.Nodes = append(digitalTwinData.Topology.Nodes, digitalTwinNode)
		}
	}

	//convert Node List to Map, Needed to up node's attribute
	nodes := digitalTwinData.Topology.Nodes
	nodeMap := make(map[string]DigitalTwinNode)
	for _, node := range nodes {
		nodeMap[node.Name] = node
	}

	for i, network := range IetfNetworkTopologyL2Data.IetfNetworkNetwork {

		links := network.LinkList
		for k, link := range links {

			log.Debug(k + i)
			log.Debug(link.LinkID)

			EndpointsRawString := (strings.Split(link.IetfL2TopologyL2LinkAttributes.Name, "--"))

			//source EndPoint
			EndpointsRawStringSourceRouterNameSlotMdaPort := (strings.Split(EndpointsRawString[0], ":"))
			EndpointsRawStringSourceRouterName := EndpointsRawStringSourceRouterNameSlotMdaPort[0]
			log.Debug("EndpointsRawStringSourceRouterName: ", EndpointsRawStringSourceRouterName)

			EndpointsRawStringSourceSlot := (strings.Split(EndpointsRawStringSourceRouterNameSlotMdaPort[1], "/")[0])
			log.Debug("EndpointsRawStringSourceSlot: ", EndpointsRawStringSourceSlot)

			EndpointsRawStringSourceMda := (strings.Split(EndpointsRawStringSourceRouterNameSlotMdaPort[1], "/")[1])
			log.Debug("EndpointsRawStringSourceMda: ", EndpointsRawStringSourceMda)

			EndpointsRawStringSourcePortCage := (strings.Split(EndpointsRawStringSourceRouterNameSlotMdaPort[1], "/")[2])
			log.Debug("EndpointsRawStringSourcePortCage: ", EndpointsRawStringSourcePortCage)

			//Destination EndPoint
			EndpointsRawStringDestinationRouterNameSlotMdaPort := (strings.Split(EndpointsRawString[1], ":"))
			EndpointsRawStringDestinationRouterName := EndpointsRawStringDestinationRouterNameSlotMdaPort[0]
			log.Debug("EndpointsRawStringDestinationRouterName: ", EndpointsRawStringDestinationRouterName)

			EndpointsRawStringDestinationSlot := (strings.Split(EndpointsRawStringDestinationRouterNameSlotMdaPort[1], "/")[0])
			log.Debug("EndpointsRawStringDestinationSlot: ", EndpointsRawStringDestinationSlot)

			EndpointsRawStringDestinationMda := (strings.Split(EndpointsRawStringDestinationRouterNameSlotMdaPort[1], "/")[1])
			log.Debug("EndpointsRawStringDestinationMda: ", EndpointsRawStringDestinationMda)

			EndpointsRawStringDestinationPortCage := (strings.Split(EndpointsRawStringDestinationRouterNameSlotMdaPort[1], "/")[2])
			log.Debug("EndpointsRawStringDestinationPortCage: ", EndpointsRawStringDestinationPortCage)

			// set Endpoint
			var SourceEndpoint string
			var DestinationEndpoint string

			// aarafat-tag: add case for SRL
			switch nodeKindSource := nodeMap[EndpointsRawStringSourceRouterName].Kind; nodeKindSource {
			case "vr-sros":
				if strings.Contains(EndpointsRawStringSourcePortCage, "c") {
					EndpointsRawStringSourcePortCage = strings.Replace(EndpointsRawStringSourcePortCage, "c", "", -1)
					SourceEndpoint = EndpointsRawStringSourceRouterName + ":eth-" + EndpointsRawStringSourcePortCage
				} else {
					SourceEndpoint = EndpointsRawStringSourceRouterName + ":eth-" + EndpointsRawStringSourcePortCage
				}
			}

			switch nodeKindDestination := nodeMap[EndpointsRawStringDestinationRouterName].Kind; nodeKindDestination {
			case "vr-sros":
				if strings.Contains(EndpointsRawStringDestinationPortCage, "c") {
					EndpointsRawStringDestinationPortCage = strings.Replace(EndpointsRawStringDestinationPortCage, "c", "", -1)
					DestinationEndpoint = EndpointsRawStringDestinationRouterName + ":eth-" + EndpointsRawStringDestinationPortCage
				} else {
					DestinationEndpoint = EndpointsRawStringDestinationRouterName + ":eth-" + EndpointsRawStringDestinationPortCage
				}
			}

			digitalTwinLink.Endpoints = "[" + SourceEndpoint + ", " + DestinationEndpoint + "]"
			digitalTwinData.Topology.Links = append(digitalTwinData.Topology.Links, digitalTwinLink)
		}
	}

	// write the Container Lab TopoFile
	TemplateString := (`
    name: topoViewerDigitalTwinDemo
    topology:
      nodes: {{range $n := .Topology.Nodes}}
         {{$n.Name}}:
           kind: {{$n.Kind}}
           group: {{$n.Group}}
           image: {{$n.Image}}
           type: {{$n.Type}}
           license: {{$n.License}}{{end}}

      links: {{range $l := .Topology.Links}}
         - endpoints: {{$l.Endpoints}}{{end}}
    `)

	digitalTwinTemplate, err := template.New("digital-twin").Parse(TemplateString)
	if err != nil {
		panic(err)
	}

	err = digitalTwinTemplate.Execute(os.Stdout, digitalTwinData)
	if err != nil {
		panic(err)
	}

}
