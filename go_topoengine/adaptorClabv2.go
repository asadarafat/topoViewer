package topoengine

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"os"
	"path"
	"strconv"

	"github.com/docker/docker/client"
	"github.com/samber/lo"
	"golang.org/x/crypto/ssh"

	tools "github.com/asadarafat/topoViewer/go_tools"
	dockerType "github.com/docker/docker/api/types"
	log "github.com/sirupsen/logrus"
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
			TopoViewerRole    string `json:"topoViewer-role"`
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
	Command      string      `json:"Command"`
	CreatedAt    interface{} `json:"CreatedAt"`
	ID           interface{} `json:"ID"`
	Image        string      `json:"Image"`
	Labels       interface{} `json:"Labels"`
	LocalVolumes string      `json:"LocalVolumes"`
	Mounts       interface{} `json:"Mounts"`
	Names        string      `json:"Names"`
	Networks     interface{} `json:"Networks"`
	Ports        interface{} `json:"Ports"`
	RunningFor   string      `json:"RunningFor"`
	Size         string      `json:"Size"`
	State        string      `json:"State"`
	Status       string      `json:"Status"`
}

func (cyTopo *CytoTopology) InitLoggerClabV2() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopology-adaptorClabV2.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) ClabTopoRead(topoFile string) []byte {
	// log.Info(topoFile)

	filePath, _ := os.Getwd()
	filePath = path.Join(filePath, topoFile)
	log.Infof("ClabTopoRead topology absolute file path: '%s'", filePath)

	// topoFileBytes, err := os.ReadFile(filePath)

	topoFileBytes, err := os.ReadFile(topoFile)

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
		cytoJson.Data.TopoViewerRole = node.Labels.TopoViewerRole

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
		cytoJson.Data.TopoViewerRole = n
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
			"clabServerUsername":   Username, // needed for wireshark capture
			"clabSourceLongName":   link.A.NodeLongName,
			"clabTargetLongName":   link.Z.NodeLongName,
			"clabSourceMacAddress": link.A.Mac,
			"clabTargetMacAddress": link.Z.Mac,
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

	// _, err = os.Stdout.Write(jsonBytesCytoUi)
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }
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

func (cyTopo *CytoTopology) RunSSHCommand(clabUser string, clabHost string, clabPassword string, command string) ([]byte, error) {
	config := &ssh.ClientConfig{
		User: clabUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(clabPassword),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	log.Infof("RunSSHCommand Function: '%s'", command)

	client, err := ssh.Dial("tcp", clabHost+":22", config)
	if err != nil {
		log.Errorf("failed to dial SSH: '%s'", err)
		return nil, err
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		log.Errorf("failed to create SSH session: %s", err)
		return nil, err
	}
	defer session.Close()

	var b bytes.Buffer
	session.Stdout = &b
	if err := session.Run(command); err != nil {
		log.Errorf("failed to run SSH command: %s", err)
		return nil, err
	}

	return b.Bytes(), nil
}

func (cyTopo *CytoTopology) GetDockerNodeStatus(clabNodeName string, clabUser string, clabHost string, clabPassword string) ([]byte, error) {
	command := "docker ps --all --format json"
	output, err := cyTopo.RunSSHCommand(clabUser, clabHost, clabPassword, command)
	if err != nil {
		return nil, err
	}

	var outputParsed DockerNodeStatus
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		var dockerNodeStatus DockerNodeStatus
		if err := json.Unmarshal([]byte(line), &dockerNodeStatus); err != nil {
			log.Debug("Error parsing JSON:", err)
			continue
		}
		if dockerNodeStatus.Names == clabNodeName {
			outputParsed = dockerNodeStatus
			break
		}
	}

	if outputParsed.Names == "" {
		return nil, fmt.Errorf("docker node with name %s not found", clabNodeName)
	}
	outputParsedMarshalled, err := json.MarshalIndent(outputParsed, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON: %w", err)
	}

	return outputParsedMarshalled, nil
}

func (cyTopo *CytoTopology) GetDockerNodeStatusViaUnixSocket(clabNodeName string, clabHost string) ([]byte, error) {

	// aarafat-tag: sample output of unix:///var/run/docker.sock vi cli.ContainerList(ctx, dockerType.ContainerListOptions{All: false})
	//
	// {
	//     "Id": "a0977499239d175e5e7a21d0d9fc06b7f8e551f7685d3a174e2f717fa9cd7635",
	//     "Names": [
	//         "/clab-Vodafone-CO-HCO-iperf01"
	//     ],
	//     "Image": "sflow/clab-iperf3",
	//     "ImageID": "sha256:14eacc2bcba9533d382025ba41f8c4698d5a4d1a339ad75611197c84e0f3f95d",
	//     "Command": "/sbin/tini -- iperf3 -s",
	//     "Created": 1696766427,
	//     "Ports": [],
	//     "Labels": {
	//         "clab-mgmt-net-bridge": "br1-private",
	//         "clab-node-group": "CE-01",
	//         "clab-node-kind": "linux",
	//         "clab-node-lab-dir": "/root/clab/LAB-Vodafone-CO-HCO/clab-Vodafone-CO-HCO/iperf01",
	//         "clab-node-name": "iperf01",
	//         "clab-node-type": "",
	//         "clab-topo-file": "/root/clab/LAB-Vodafone-CO-HCO/topo-vf-hco-ip-certification.yml",
	//         "containerlab": "Vodafone-CO-HCO",
	//         "description": "iperf3 for CONTAINERlab",
	//         "maintainer": "InMon Corp. https://inmon.com",
	//         "topoViewer-role": "server",
	//         "url": "https://hub.docker.com/r/sflow/clab-iperf3"
	//     },
	//     "State": "running",
	//     "Status": "Up 6 days",
	//     "HostConfig": {
	//         "NetworkMode": "custom_mgmt"
	//     },
	//     "NetworkSettings": {
	//         "Networks": {
	//             "custom_mgmt": {
	//                 "IPAMConfig": {},
	//                 "Links": null,
	//                 "Aliases": null,
	//                 "NetworkID": "293258bc6afa4f17453c82522fd5bb5e7f8a69acf9836282a2923214e5653b9c",
	//                 "EndpointID": "7428e3be867f2028d2e1390eafc83bfb1cbe4a922b7e747ec003504ea391d352",
	//                 "Gateway": "10.10.10.11",
	//                 "IPAddress": "10.10.10.2",
	//                 "IPPrefixLen": 24,
	//                 "IPv6Gateway": "",
	//                 "GlobalIPv6Address": "",
	//                 "GlobalIPv6PrefixLen": 0,
	//                 "MacAddress": "02:42:0a:0a:0a:02",
	//                 "DriverOpts": null
	//             }
	//         }
	//     },
	//     "Mounts": []
	// }

	// Create a Docker client connected to the Unix socket
	cli, err := client.NewClientWithOpts(client.WithHost("unix:///var/run/docker.sock"))
	if err != nil {
		log.Errorf("Failed to create Docker client: %v", err)
	}
	defer cli.Close() // Ensure Docker client is closed when the function exits

	// Set a timeout for the Docker API requests (optional)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	// List Docker containers
	containers, err := cli.ContainerList(ctx, dockerType.ContainerListOptions{All: true})
	if err != nil {
		log.Errorf("Failed to list containers: %v", err)
	}

	// Print container information
	var dockerNodeStatus DockerNodeStatus

	for _, container := range containers {
		log.Debugf("Container Names: %v\n", container.Names)
		log.Debugf("Container State: %s\n", container.State)

		if container.Names[0] == "/"+clabNodeName {

			dockerNodeStatus.Command = container.Command
			dockerNodeStatus.CreatedAt = container.Created
			dockerNodeStatus.ID = container.Created
			dockerNodeStatus.Labels = container.Labels
			dockerNodeStatus.LocalVolumes = ""
			dockerNodeStatus.Mounts = container.Mounts
			dockerNodeStatus.Names = strings.ReplaceAll(container.Names[0], "/", "")
			dockerNodeStatus.Networks = container.NetworkSettings
			dockerNodeStatus.Ports = container.Ports
			dockerNodeStatus.RunningFor = ""
			dockerNodeStatus.Size = ""
			dockerNodeStatus.State = container.State
			dockerNodeStatus.Status = container.Status
		}
	}

	// if dockerNodeStatus.Names[0] == "" {
	// 	log.Errorf("docker node with name %s not found", clabNodeName)
	// 	return nil, fmt.Errorf("docker node with name %s not found", clabNodeName)
	// }

	outputParsedMarshalled, err := json.MarshalIndent(dockerNodeStatus, "", "  ")
	if err != nil {
		log.Errorf("failed to marshal JSON: %v", err)
		return nil, fmt.Errorf("failed to marshal JSON: %w", err)
	}

	log.Debug(string(outputParsedMarshalled))

	return outputParsedMarshalled, nil
}
