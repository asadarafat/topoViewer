package topoengine

import (
	"encoding/json"
	"os"
	"strconv"

	log "github.com/sirupsen/logrus"
	types "github.com/srl-labs/containerlab/types"
	"gopkg.in/yaml.v3"

	tools "github.com/asadarafat/topoViewer/tools"
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
}

type DigitalTwinLink struct {
	Endpoints string `yaml:"endpoints"`
}

func (cyTopo *CytoTopology) InitLoggerDigitalTwin() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-nspDigitalTwin.log", cyTopo.LogLevel)
}

// func (cyTopo *CytoTopology) IetfL2TopoRead(topoFile string) []byte {

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
		ClabTopo.NodeDefinition = m

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
	log.Debug(ClabTopo.NodeDefinition["10.10.10.2"].Kind)
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
			digitalTwinNode.Name = node.NodeID
			digitalTwinNode.Kind = "vr-sros"
			digitalTwinNode.MgmtIpv4 = "30.30." + strconv.Itoa(i+1) + "." + strconv.Itoa(j+1)
			digitalTwinNode.Group = "sros"
			digitalTwinNode.Image = "registry.srlinux.dev/pub/vr-sros:22.7.R1"
			digitalTwinNode.License = "license.txt"
			digitalTwinNode.Type = "cp: cpu=2 ram=6 chassis=SR-2s slot=A card=cpm-2s ___ lc: cpu=2 ram=4 max_nics=10 chassis=SR-2s slot=1 card=xcm-2s mda/1=s18-100gb-qsfp28"
			digitalTwinData.Topology.Nodes = append(digitalTwinData.Topology.Nodes, digitalTwinNode)
		}
		links := network.LinkList

		for k, link := range links {

			log.Debug(k)
			log.Debug(link.LinkID)
			digitalTwinLink.Endpoints =
				"[" + link.Source.SourceNode[70:len(link.Source.SourceNode)-2] + ":" + link.Source.SourceTp[135:len(link.Source.SourceTp)-2] + ", " + link.Destination.DestNode[70:len(link.Destination.DestNode)-2] + ":" + link.Destination.DestTp[135:len(link.Destination.DestTp)-2] + "]"
			// Links []struct {
			// 	Endpoints []string `yaml:"endpoints"`
			// } `yaml:"links"`
			digitalTwinData.Topology.Links = append(digitalTwinData.Topology.Links, digitalTwinLink)

		}

	}
	yamlBytes, err := yaml.Marshal(digitalTwinData)
	if err != nil {
		log.Error(err)
		panic(err)
	}

	_, err = os.Stdout.Write(yamlBytes)
	if err != nil {
		log.Error(err)
		panic(err)
	}
	log.Info("jsonBytesCytoUi Result:", string(yamlBytes))
}
