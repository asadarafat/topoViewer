package topoengine

import (
	"encoding/json"
	"os"
	"os/user"
	"path"
	"strconv"

	"github.com/samber/lo"
	log "github.com/sirupsen/logrus"

	tools "github.com/asadarafat/topoViewer/tools"
)

type ClabTopoV2 struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Clab struct {
		Config struct {
			Prefix string `json:"prefix"`
			Mgmt   struct {
				Network        string `json:"network"`
				Bridge         string `json:"bridge"`
				Ipv4Subnet     string `json:"ipv4-subnet"`
				Ipv4Gw         string `json:"ipv4-gw"`
				Ipv6Gw         string `json:"ipv6-gw"`
				Mtu            string `json:"mtu"`
				ExternalAccess bool   `json:"external-access"`
			} `json:"mgmt"`
		} `json:"config"`
	} `json:"clab"`
	Nodes []struct {
		ID                   string `json:"id"`
		Index                string `json:"index"`
		Shortname            string `json:"shortname"`
		Longname             string `json:"longname"`
		Fqdn                 string `json:"fqdn"`
		Group                string `json:"group"`
		Labdir               string `json:"labdir"`
		Kind                 string `json:"kind"`
		Image                string `json:"image"`
		MgmtNet              string `json:"mgmt-net"`
		MgmtIntf             string `json:"mgmt-intf"`
		MgmtIpv4Address      string `json:"mgmt-ipv4-address"`
		MgmtIpv4PrefixLength int    `json:"mgmt-ipv4-prefix-length"`
		MgmtIpv6Address      string `json:"mgmt-ipv6-address"`
		MgmtIpv6PrefixLength int    `json:"mgmt-ipv6-prefix-length"`
		MacAddress           string `json:"mac-address"`
		Labels               struct {
			ClabMgmtNetBridge string `json:"clab-mgmt-net-bridge"`
			ClabNodeGroup     string `json:"clab-node-group"`
			ClabNodeKind      string `json:"clab-node-kind"`
			ClabNodeLabDir    string `json:"clab-node-lab-dir"`
			ClabNodeName      string `json:"clab-node-name"`
			ClabNodeType      string `json:"clab-node-type"`
			ClabTopoFile      string `json:"clab-topo-file"`
			Containerlab      string `json:"containerlab"`
			TopoViewerRole    string `json:"topo-viewer-role"`
		} `json:"labels"`
	} `json:"nodes"`
	Links []struct {
		A struct {
			Node         string `json:"node"`
			NodeLongName string `json:"nodeLongName"`
			Interface    string `json:"interface"`
			Mac          string `json:"mac"`
			Peer         string `json:"peer"`
		} `json:"a"`
		Z struct {
			Node         string `json:"node"`
			NodeLongName string `json:"nodeLongName"`
			Interface    string `json:"interface"`
			Mac          string `json:"mac"`
			Peer         string `json:"peer"`
		} `json:"z"`
	} `json:"links"`
}

func (cyTopo *CytoTopology) InitLoggerClabV2() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) ClabTopoRead(topoFile string) []byte {
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

func (cyTopo *CytoTopology) UnmarshalContainerLabTopoV2(topoFile []byte) []byte {

	// initiate cytoJson struct
	cytoJson := CytoJson{}
	cytoJsonList := []CytoJson{}
	var topoviewerParentList []string

	// unmarshal topoFile into clabTopoStruct
	json.Unmarshal(topoFile, &cyTopo.ClabTopoDataV2)

	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}
	Username := user.Username

	//map the clabTopoStruct content to cytoJson content
	for _, node := range cyTopo.ClabTopoDataV2.Nodes {
		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = node.ID
		cytoJson.Data.Weight = "30"
		cytoJson.Data.Name = node.ID
		cytoJson.Data.TopoviewerRole = node.Labels.TopoViewerRole

		if len(node.Group) != 0 {
			cytoJson.Data.Parent = node.Group
		}

		// else {
		// 	cytoJson.Data.Parent = "other"
		// }

		topoviewerParentList = append(topoviewerParentList, cytoJson.Data.Parent)

		log.Debug("node.Labels.ClabMgmtNetBridge: ", node.Labels.ClabMgmtNetBridge)
		// cytoJson.Data.ExtraData = node
		cytoJson.Data.ExtraData = map[string]interface{}{
			"clabServerUsername":    Username,
			"id":                    node.ID,
			"weight":                "3",
			"name":                  node.Shortname,
			"index":                 node.Index,
			"shortname":             node.Shortname,
			"longname":              node.Longname,
			"fqdn":                  node.Fqdn,
			"group":                 node.Group,
			"labdir":                node.Labdir,
			"kind":                  node.Kind,
			"image":                 node.Image,
			"mgmtNet":               node.MgmtNet,
			"mgmtIntf":              node.MgmtIntf,
			"mgmtIpv4Addresss":      node.MgmtIpv4Address,
			"mgmtIpv4AddressLength": node.MgmtIpv4PrefixLength,
			"mgmtIpv6Address":       node.MgmtIpv6Address,
			"mgmtIpv6AddressLength": node.MgmtIpv6PrefixLength,
			"macAddress":            node.MacAddress,
			"labels": struct {
				ClabMgmtNetBridge string
				ClabNodeGroup     string
				ClabNodeKind      string
				ClabNodeLabDir    string
				ClabNodeName      string
				ClabNodeType      string
				ClabTopoFile      string
				Containerlab      string
				TopoViewerRole    string
			}{
				node.Labels.ClabMgmtNetBridge,
				node.Labels.ClabNodeGroup,
				node.Labels.ClabNodeKind,
				node.Labels.ClabNodeLabDir,
				node.Labels.ClabNodeName,
				node.Labels.ClabNodeType,
				node.Labels.ClabTopoFile,
				node.Labels.Containerlab,
				node.Labels.TopoViewerRole,
			},
		}
		cytoJsonList = append(cytoJsonList, cytoJson)
	}

	uniqTopoviewerParentList := lo.Uniq(topoviewerParentList)
	log.Debug("Unique Parent List: ", uniqTopoviewerParentList)

	// add Parent Nodes Per topoviewerRoleList
	for _, n := range uniqTopoviewerParentList {
		cytoJson.Group = "nodes"
		cytoJson.Data.Parent = ""
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = n
		cytoJson.Data.Name = n
		cytoJson.Data.TopoviewerRole = n
		cytoJson.Data.Weight = "1000"
		cytoJson.Data.ExtraData = map[string]interface{}{
			"clabServerUsername": Username,
			"weight":             "2",
			"name":               "",
		}
		cytoJsonList = append(cytoJsonList, cytoJson)
	}

	for i, link := range cyTopo.ClabTopoDataV2.Links {
		cytoJson.Group = "edges"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true

		cytoJson.Data.ID = "Clab-Link" + strconv.Itoa(i)
		cytoJson.Data.Weight = "3"
		cytoJson.Data.Source = link.A.Node
		cytoJson.Data.Target = link.Z.Node
		cytoJson.Data.SourceEndpoint = link.A.Interface
		cytoJson.Data.TargetEndpoint = link.Z.Interface

		cytoJson.Data.ExtraData = map[string]interface{}{
			"clabServerUsername": Username, // needed for wireshark capture
			"clabSourceLongName": link.A.NodeLongName,
			"clabTargetLongName": link.Z.NodeLongName,
		}
		cytoJsonList = append(cytoJsonList, cytoJson)
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
	log.Debug("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	return jsonBytesCytoUi
}

func (cyTopo *CytoTopology) PrintjsonBytesCytoUiV2(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+cyTopo.ClabTopoDataV2.Name, 0755)
	file, err := os.Create("html-public/" + cyTopo.ClabTopoDataV2.Name + "/dataCytoMarshall-" + cyTopo.ClabTopoDataV2.Name + ".json")
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
