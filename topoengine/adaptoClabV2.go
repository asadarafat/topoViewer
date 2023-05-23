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
				Mtu            string `json:"mtu"`
				ExternalAccess bool   `json:"external-access"`
			} `json:"mgmt"`
		} `json:"config"`
	} `json:"clab"`
	Nodes []struct {
		NodeID               string `json:"id"`
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
		} `json:"labels"`
	} `json:"nodes"`
	Links []struct {
		A struct {
			Node      string `json:"node"`
			Interface string `json:"interface"`
			Mac       string `json:"mac"`
			Peer      string `json:"peer"`
		} `json:"a"`
		Z struct {
			Node      string `json:"node"`
			Interface string `json:"interface"`
			Mac       string `json:"mac"`
			Peer      string `json:"peer"`
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

	cyTopo.IetfNetworL2TopoData = topoFileBytes
	return topoFileBytes
}

func (cyTopo *CytoTopology) UnmarshalContainerLabTopoV2(topoFile []byte, clabTopoStruct ClabTopoV2) []byte {

	// initiate cytoJson struct
	cytoJson := CytoJson{}

	// unmarshal topoFile into clabTopoStruct
	json.Unmarshal(topoFile, &clabTopoStruct)

	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}
	Username := user.Username

	//map the clabTopoStruct content to cytoJson content
	for i, node := range clabTopoStruct.Nodes {
		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = "Clab-" + strconv.Itoa(i)
		cytoJson.Data.Weight = "3"
		cytoJson.Data.Name = node.NodeID

		cytoJson.Data.ExtraData = map[string]interface{}{

			"ClabServerUsername": Username,
			"ClabNodeName":       node.Shortname,
			"ClabNodeLongName":   node.Longname,
			"ID":                 strconv.Itoa(i),
			"Weight":             "2",
			"Name":               node.Shortname,
			"ClabKind":           node.Kind,
			"Image":              node.Image,
			"ClabGroup":          node.Group,
			"MgmtIPv4Address":    node.MgmtIpv4Address,
			"MgmtIPv6Address":    node.MgmtIpv6Address,
		}
	}

	// Throw unmarshalled result to log
	// log.Info(cytoJsonList)
	jsonBytesCytoUi, err := json.MarshalIndent(cytoJson, "", "  ")
	if err != nil {
		log.Error(err)
		panic(err)
	}

	_, err = os.Stdout.Write(jsonBytesCytoUi)
	if err != nil {
		log.Error(err)
		panic(err)
	}
	log.Debugf("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	return jsonBytesCytoUi
}

func (cyTopo *CytoTopology) PrintjsonBytesCytoUiV2(marshaledJsonBytesCytoUi []byte) error {
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
