package topoengine

import (
	"bytes"
	"encoding/json"
	"strings"

	"os"
	"path"
	"strconv"

	"github.com/samber/lo"
	"golang.org/x/crypto/ssh"

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

// Define a struct to match the structure of the JSON data
type DockerNodeStatus struct {
	Command      string `json:"Command"`
	CreatedAt    string `json:"CreatedAt"`
	ID           string `json:"ID"`
	Image        string `json:"Image"`
	Labels       string `json:"Labels"`
	LocalVolumes string `json:"LocalVolumes"`
	Mounts       string `json:"Mounts"`
	Names        string `json:"Names"`
	Networks     string `json:"Networks"`
	Ports        string `json:"Ports"`
	RunningFor   string `json:"RunningFor"`
	Size         string `json:"Size"`
	State        string `json:"State"`
	Status       string `json:"Status"`
}

func (cyTopo *CytoTopology) InitLoggerClabV2() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) ClabTopoRead(topoFile string) []byte {
	// log.Info(topoFile)

	filePath, _ := os.Getwd()
	log.Info("topology file path: ", filePath)

	filePath = path.Join(filePath, topoFile)
	log.Info("topology file path: ", filePath)

	topoFileBytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	return topoFileBytes
}

func (cyTopo *CytoTopology) UnmarshalContainerLabTopoV2(topoFile []byte, clabHostUsername string) []byte {

	// initiate cytoJson struct
	cytoJson := CytoJson{}
	cytoJsonNodeStatusRed := CytoJson{}
	cytoJsonNodeStatusGreen := CytoJson{}
	cytoJsonList := []CytoJson{}

	var topoviewerParentList []string

	// unmarshal topoFile into clabTopoStruct
	json.Unmarshal(topoFile, &cyTopo.ClabTopoDataV2)

	// // get Clab ServerHost Username
	// user, err := user.Current()
	// if err != nil {
	// 	log.Error(err.Error())
	// }
	// Username := user.Username
	// Clab ServerHost Username should be passed from parameter
	Username := clabHostUsername

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

		// create list of parent nodes
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

		cytoJsonNodeStatusRed.Group = "nodes"
		cytoJsonNodeStatusRed.Grabbable = false
		cytoJsonNodeStatusRed.Selectable = false
		cytoJsonNodeStatusRed.Data.ID = node.ID + "-statusRed"
		cytoJsonNodeStatusRed.Data.Weight = "30"
		cytoJsonNodeStatusRed.Data.Name = node.ID + "-statusRed"

		if len(node.Group) != 0 {
			cytoJsonNodeStatusRed.Data.Parent = node.Group
		}

		cytoJsonNodeStatusGreen.Group = "nodes"
		cytoJsonNodeStatusGreen.Grabbable = false
		cytoJsonNodeStatusGreen.Selectable = false
		cytoJsonNodeStatusGreen.Data.ID = node.ID + "-statusGreen"
		cytoJsonNodeStatusGreen.Data.Weight = "30"
		cytoJsonNodeStatusGreen.Data.Name = node.ID + "-statusGreen"

		if len(node.Group) != 0 {
			cytoJsonNodeStatusGreen.Data.Parent = node.Group
		}

		// create list of parent nodes
		topoviewerParentList = append(topoviewerParentList, cytoJson.Data.Parent)

		cytoJsonList = append(cytoJsonList, cytoJson, cytoJsonNodeStatusRed, cytoJsonNodeStatusGreen)
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

func (cyTopo *CytoTopology) PrintjsonBytesCytoUiV2(JsonBytesCytoUiMarshaled []byte) error {
	// Create file
	os.Mkdir("./html-public/"+cyTopo.ClabTopoDataV2.Name, 0755)
	file, err := os.Create("html-public/" + cyTopo.ClabTopoDataV2.Name + "/dataCytoMarshall-" + cyTopo.ClabTopoDataV2.Name + ".json")
	if err != nil {
		log.Error("Could not create json file for graph")
	}

	// Write to file
	_, err = file.Write(JsonBytesCytoUiMarshaled)
	if err != nil {
		log.Error("Could not write json to file")
	}
	return err
}

func (cyTopo *CytoTopology) GetDockerNodeStatus(clabNodeName string, clabUser string, clabHost string, clabPassword string) []byte {
	// // get docker node status using exec
	// command := "docker ps --all --format json"

	// // Split the command into parts
	// parts := strings.Fields(command)
	// cmd := exec.Command(parts[0], parts[1:]...)

	// // CombinedOutput runs the command and returns its combined standard output and standard error.
	// output, err := cmd.CombinedOutput()

	config := &ssh.ClientConfig{
		User: clabUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(clabPassword),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	log.Debug("clabUser: " + clabUser)
	log.Debug("clabHost: " + clabHost)
	log.Debug("clabPassword: " + clabPassword)

	client, err := ssh.Dial("tcp", clabHost+":22", config)
	if err != nil {
		log.Error("Failed to dial: ", err)
	}

	// Each ClientConn can support multiple interactive sessions,
	// represented by a Session.
	session, err := client.NewSession()
	if err != nil {
		log.Error("Failed to create session: ", err)
	}
	defer session.Close()

	// Once a Session is created, you can execute a single command on
	// the remote side using the Run method.
	var b bytes.Buffer
	session.Stdout = &b
	if err := session.Run("docker ps --all --format json"); err != nil {
		log.Error("Failed to run: " + err.Error())
	}
	// fmt.Println(b.String())

	output := b.String()

	var outputParsed DockerNodeStatus
	var OutputParsedMarshalled []byte

	if err != nil {
		log.Error("Error:", err)
	}
	// log.Debug(string(output))

	lines := strings.Split(string(output), "\n")

	for _, line := range lines {
		if line == "" {
			continue
		}

		var dockerNodeStatus DockerNodeStatus
		err := json.Unmarshal([]byte(line), &dockerNodeStatus)
		if err != nil {
			log.Debug("Error parsing JSON:", err)
			continue
		}
		if dockerNodeStatus.Names == clabNodeName {
			json.Unmarshal([]byte(line), &outputParsed)
			OutputParsedMarshalled, err := json.MarshalIndent(outputParsed, "", "  ")
			if err != nil {
				log.Error(err)
				panic(err)
			}
			return OutputParsedMarshalled
		}
	}
	return OutputParsedMarshalled

}
