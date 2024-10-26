package topoengine

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"os"
	"path"
	"strconv"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gosnmp/gosnmp"
	"github.com/samber/lo"
	containerlab "github.com/srl-labs/containerlab/clab"
	"golang.org/x/crypto/ssh"

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

type PortInfo struct {
	NodeName      string `json:"nodeName"`
	IfName        string `json:"ifName"`
	IfDescription string `json:"ifDescription"`
	IfPhysAddress string `json:"ifPhysAddress"`
	IfMtu         string `json:"ifMtu"`
	IfType        string `json:"ifType"`
	IfAdminStatus string `json:"ifAdminStatus"`
	IfOperStatus  string `json:"ifOperStatus"`
	IfExtraField  string `json:"ifExtraField"`
}

// ClabNetemInterfaceData holds the structured data for each interface
type ClabNetemInterfaceData struct {
	Node       string `json:"node"`
	Interface  string `json:"interface"`
	Delay      string `json:"delay"`
	Jitter     string `json:"jitter"`
	PacketLoss string `json:"packet_loss"`
	Rate       string `json:"rate"`
}

// func (cyTopo *CytoTopology) InitLogger() {
// 	// init logConfig
// 	toolLogger := tools.Logs{}
// 	toolLogger.InitLogger("logs/topoengine-CytoTopology-adaptorClabV2.log", cyTopo.LogLevel)
// }

func (cyTopo *CytoTopology) GenerateClabTopoFromYaml(clabYamlTopoFile string) (string, error) {
	log.Infof("<go_topoengine><I>GenerateClabTopoFromYaml: Generating clab json topology, from clab yaml %s>", clabYamlTopoFile)

	// dynamic definition of topofile path
	c, err := containerlab.NewContainerLab(
		containerlab.WithTimeout(time.Second*30),
		containerlab.WithTopoPath(clabYamlTopoFile, ""),
	)
	if err != nil {
		log.Errorf("<go_topoengine><I>GenerateClabTopoFromYaml: Failed creating containerlab instance %s>", err)
		return "nil", err
	}

	c.ResolveLinks()

	// topoDataFPath := c.TopoPaths.TopoExportFile()
	// return path.Join(t.labDir, topologyExportDatFileName)

	labDir := "./html-public/" + c.Config.Name
	os.Mkdir(labDir, 0755)

	clabJsonTopoFilePath := path.Join(labDir, "topology-data.json")
	topoDataF, _ := os.Create(clabJsonTopoFilePath)

	ctx, _ := context.WithCancel(context.Background())
	c.GenerateExports(ctx, topoDataF, "./clab-topoviewer.tmpl")

	log.Infof("clab json topology succesfully generated, location of the file is %s", clabJsonTopoFilePath)

	return clabJsonTopoFilePath, nil
}

func (cyTopo *CytoTopology) ClabTopoJsonRead(topoFile string) []byte {
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

func (cyTopo *CytoTopology) UnmarshalContainerLabTopoV2(topoFile []byte, clabHostUsername string, nodeEndpointDetailSourceTarget []byte) []byte {

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
			"clabServerUsername":          Username, // needed for wireshark capture
			"clabSourceLongName":          "",
			"clabTargetLongName":          "",
			"clabSourceMacAddress":        "",
			"clabTargetMacAddress":        "",
			"clabSourcePort":              link.A.Interface,
			"clabTargetPort":              link.Z.Interface,
			"topoViewerSnmpGetSourcePort": "",
			"topoViewerSnmpGetTargetPort": "",
		}

		if len(nodeEndpointDetailSourceTarget) > 0 {
			var x [][]map[string]map[string]interface{}
			json.Unmarshal([]byte(nodeEndpointDetailSourceTarget), &x)

			if link.A.NodeLongName == x[0][0]["index-1"]["nodeName"] && link.Z.NodeLongName == x[1][0]["index-1"]["nodeName"] {
				linkAInterfaceIndex, _ := strconv.Atoi(strings.TrimPrefix(link.A.Interface, "eth"))
				cytoJson.Data.SourceEndpoint = fmt.Sprintf("%s", x[0][linkAInterfaceIndex-1][fmt.Sprintf("index-%s", strings.TrimPrefix(link.A.Interface, "eth"))]["ifName"])

				linkZInterfaceIndex, _ := strconv.Atoi(strings.TrimPrefix(link.Z.Interface, "eth"))
				cytoJson.Data.TargetEndpoint = fmt.Sprintf("%s", x[1][linkZInterfaceIndex-1][fmt.Sprintf("index-%s", strings.TrimPrefix(link.Z.Interface, "eth"))]["ifName"])

				cytoJson.Data.ExtraData = map[string]interface{}{
					"clabServerUsername":          Username, // needed for wireshark capture
					"clabSourceLongName":          link.A.NodeLongName,
					"clabTargetLongName":          link.Z.NodeLongName,
					"clabSourceMacAddress":        link.A.Mac,
					"clabTargetMacAddress":        link.Z.Mac,
					"clabSourcePort":              link.A.Interface,
					"clabTargetPort":              link.Z.Interface,
					"topoViewerSnmpGetSourcePort": fmt.Sprintf("%s", x[0][linkAInterfaceIndex-1][fmt.Sprintf("index-%s", strings.TrimPrefix(link.A.Interface, "eth"))]["ifName"]),
					"topoViewerSnmpGetTargetPort": fmt.Sprintf("%s", x[1][linkZInterfaceIndex-1][fmt.Sprintf("index-%s", strings.TrimPrefix(link.Z.Interface, "eth"))]["ifName"]),
				}
			} else {
				cytoJson.Data.SourceEndpoint = link.A.Interface
				cytoJson.Data.TargetEndpoint = link.Z.Interface
				cytoJson.Data.ExtraData = map[string]interface{}{
					"clabServerUsername":          Username, // needed for wireshark capture
					"clabSourceLongName":          link.A.NodeLongName,
					"clabTargetLongName":          link.Z.NodeLongName,
					"clabSourceMacAddress":        link.A.Mac,
					"clabTargetMacAddress":        link.Z.Mac,
					"clabSourcePort":              link.A.Interface,
					"clabTargetPort":              link.Z.Interface,
					"topoViewerSnmpGetSourcePort": "",
					"topoViewerSnmpGetTargetPort": "",
				}
			}
		} else {
			cytoJson.Data.SourceEndpoint = link.A.Interface
			cytoJson.Data.TargetEndpoint = link.Z.Interface
			cytoJson.Data.ExtraData = map[string]interface{}{
				"clabServerUsername":          Username, // needed for wireshark capture
				"clabSourceLongName":          link.A.NodeLongName,
				"clabTargetLongName":          link.Z.NodeLongName,
				"clabSourceMacAddress":        link.A.Mac,
				"clabTargetMacAddress":        link.Z.Mac,
				"clabSourcePort":              link.A.Interface,
				"clabTargetPort":              link.Z.Interface,
				"topoViewerSnmpGetSourcePort": "",
				"topoViewerSnmpGetTargetPort": "",
			}
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
	// os.Mkdir("./html-public/"+cyTopo.ClabTopoDataV2.Name, 0755)
	// file, err := os.Create("html-public/" + cyTopo.ClabTopoDataV2.Name + "/dataCytoMarshall-" + cyTopo.ClabTopoDataV2.Name + ".json")
	file, err := os.Create("html-public/" + cyTopo.ClabTopoDataV2.Name + "/dataCytoMarshall.json")
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

func (cyTopo *CytoTopology) RunExecCommand(clabUser string, clabHost string, command string) ([]byte, error) {

	log.Infof("RunExecCommand Function: '%s'", command)

	// Split the command into individual arguments
	args := strings.Fields(command)
	cmd := exec.Command(args[0], args[1:]...)

	output, err := cmd.Output()

	if err != nil {
		if err, ok := err.(*exec.ExitError); ok {
			// The command exited with a non-zero status code
			return nil, err
		}
		return nil, err
	}

	log.Infof("Output of RunExecCommand: %s", output)
	log.Errorf("Error of RunExecCommand: %s", err)

	return output, err
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
	// container.ListOptions{All: true})
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
	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})

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

// SROS
// # snmpwalk -v2c -c private clab-mixed-berlin system
// SNMPv2-MIB::sysDescr.0 = STRING: TiMOS-B-23.10.R1 both/x86_64 Nokia 7750 SR Copyright (c) 2000-2023 Nokia.
// All rights reserved. All use subject to applicable license agreements.
// Built on Thu Oct 26 20:12:19 UTC 2023 by builder in /builds/2310B/R1/panos/main/sros
// SNMPv2-MIB::sysObjectID.0 = OID: SNMPv2-SMI::enterprises.6527.1.3.15
// DISMAN-EVENT-MIB::sysUpTimeInstance = Timeticks: (32461) 0:05:24.61
// SNMPv2-MIB::sysContact.0 = STRING: swisotzk
// SNMPv2-MIB::sysName.0 = STRING: berlin
// SNMPv2-MIB::sysLocation.0 = STRING: Berlin (Germany)
// SNMPv2-MIB::sysServices.0 = INTEGER: 79

// SR Linux
// # snmpwalk -v2c -c private clab-mixed-madrid system
// SNMPv2-MIB::sysDescr.0 = STRING: SRLinux-v0.0.0-53661-g7518a5eff1 7730 SXR-1x-44S Copyright (c) 2000-2020 Nokia. Kernel 5.4.236-1.el7.elrepo.x86_64 #1 SMP Mon Mar 13 21:36:53 EDT 2023
// SNMPv2-MIB::sysObjectID.0 = OID: SNMPv2-SMI::zeroDotZero.0
// DISMAN-EVENT-MIB::sysUpTimeInstance = Timeticks: (41600) 0:06:56.00
// SNMPv2-MIB::sysContact.0 = STRING: swisotzk
// SNMPv2-MIB::sysName.0 = STRING: madrid
// SNMPv2-MIB::sysLocation.0 = STRING: N 40 25 0, W 3 43 0

func (cyTopo *CytoTopology) SendSnmpGetNodeEndpoint(targetAddress string, targetCommunity string, targetVersion gosnmp.SnmpVersion) ([]byte, map[string][]PortInfo, error) {
	log.Infof("######################## %s %s", targetAddress, targetCommunity)

	g := &gosnmp.GoSNMP{
		Target:    targetAddress,
		Port:      uint16(161),
		Community: targetCommunity,
		Version:   targetVersion,
		Timeout:   time.Duration(500) * time.Millisecond,
		Retries:   0,
	}

	printResult := func(format string, values ...interface{}) {
		fmt.Printf(format, values...)
	}

	interfaceOIDList := []string{".1.3.6.1.2.1.31.1.1.1.1", // ifName
		".1.3.6.1.2.1.2.2.1.2", // ifDescr
		".1.3.6.1.2.1.2.2.1.6", // ifPhysAddress
		".1.3.6.1.2.1.2.2.1.4", // ifMtu
		".1.3.6.1.2.1.2.2.1.3", // ifType
		".1.3.6.1.2.1.2.2.1.7", // ifAdminStatus
		".1.3.6.1.2.1.2.2.1.8"} // ifOperStatus

	var nestedList [][]interface{}

	for _, rootOID := range interfaceOIDList {
		// log.Infof("Iteration %s", strconv.Itoa(i))

		err := g.Connect()
		if err != nil {
			log.Errorf("<adaptorClabV2><E><Connect() to %s with OID %s error: %v>", targetAddress, rootOID, err)

		}
		defer g.Conn.Close()

		result, err := g.WalkAll(rootOID)
		if err != nil {
			log.Errorf("<adaptorClabV2><E><WalkAll() to %s with OID %s error: %v>", targetAddress, rootOID, err)

		}

		// The fmt.Sprintf function uses formatting verbs to represent different types of values. Here are some common formatting verbs used with fmt.Sprintf:

		// %v: default format for the value.
		// %T: a Go-syntax representation of the type of the value.
		// %t: boolean (true or false).
		// %b: base 2 (binary).
		// %c: character represented by the corresponding Unicode code point.
		// %d: decimal (base 10).
		// %o: octal (base 8).
		// %x: hexadecimal (base 16) with lowercase letters.
		// %X: hexadecimal with uppercase letters.
		// %U: Unicode format: U+1234, same as "%#U".
		// %e, %E: scientific notation (e.g., -1.234456e+78).
		// %f, %F: decimal-point notation (e.g., 123.456).
		// %g, %G: either scientific notation or decimal-point notation, depending on the value.
		// %s: the uninterpreted bytes of the string or slice.
		// %q: a double-quoted string safely escaped with Go syntax.
		// %p: pointer representation (base 16), with leading 0x.

		// var ethernetCsmacd = 6

		// Print the SNMP walk results

		for j, pdu := range result {
			nestedList = append(nestedList, []interface{}{strconv.Itoa(j)})

			switch rootOID {
			case ".1.3.6.1.2.1.31.1.1.1.1": // ifName
				// fmt.Printf("iteration %v, %v ", j, i)
				// pduType := pdu.Type
				// printResult("ifName, OID is %s, PDU Type is %s, PDU Value is %s\n", rootOID, pduType, pdu.Value)
				outputValue := fmt.Sprintf("ifName: %s", pdu.Value)
				nestedList[j] = append(nestedList[j], outputValue)

			case ".1.3.6.1.2.1.2.2.1.2": // ifDescr
				// fmt.Printf("iteration %v, %v ", j, i)
				// pduType := pdu.Type
				// printResult("ifDescr, OID is %s, PDU Type is %s, PDU Value is %s\n", rootOID, pduType, pdu.Value)
				outputValue := fmt.Sprintf("ifDescr: %s", pdu.Value)
				nestedList[j] = append(nestedList[j], outputValue)

			case ".1.3.6.1.2.1.2.2.1.6": // ifPhysAddress (MAC Address)
				// fmt.Printf("iteration %v, %v ", j, i)
				// pduType := pdu.Type
				// printResult("ifPhysAddress, OID is %s, PDU Type is %s, PDU Value %s\n", rootOID, pduType, pdu.Value)
				octetString := pdu.Value.([]byte)
				macBytes := octetString[:6] // Extract the first 6 bytes
				outputValue := fmt.Sprintf("ifPhysAddress: %02X:%02X:%02X:%02X:%02X:%02X", macBytes[0], macBytes[1], macBytes[2], macBytes[3], macBytes[4], macBytes[5])

				nestedList[j] = append(nestedList[j], outputValue)

			case ".1.3.6.1.2.1.2.2.1.4": // ifMtu
				// fmt.Printf("iteration %v, %v ", j, i)
				// pduType := pdu.Type
				// printResult("ifMtu, OID is %s, PDU Type is %s, PDU value is: %d\n", rootOID, pduType, pdu.Value)
				outputValue := fmt.Sprintf("ifMtu: %d", pdu.Value)
				nestedList[j] = append(nestedList[j], outputValue)

			case ".1.3.6.1.2.1.2.2.1.3": // ifType
				// fmt.Printf("iteration %v, %v ", j, i)

				oidName := "ifType"

				switch pdu.Value {
				case 6:
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "ethernet-csmacd")
					outputValue := fmt.Sprintf("%s: %s", oidName, "ethernet-csmacd")
					nestedList[j] = append(nestedList[j], outputValue)

				case 24:
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "softwareLoopback")
					outputValue := fmt.Sprintf("%s: %s", oidName, "softwareLoopback")
					nestedList[j] = append(nestedList[j], outputValue)

				case 142:
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "ipForward")
					outputValue := fmt.Sprintf("%s: %s", oidName, "ipForward")
					nestedList[j] = append(nestedList[j], outputValue)
				default:
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, pdu.Value)
					pduType := pdu.Type
					outputValue := fmt.Sprintf("%s: %s", oidName, pduType)
					nestedList[j] = append(nestedList[j], outputValue)
				}

			case ".1.3.6.1.2.1.2.2.1.7": // ifAdminStatus
				pduType := pdu.Type
				// fmt.Printf("iteration %v, %v ", j, i)
				oidName := "ifAdminStatus"

				if pdu.Value == 1 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Up")
					outputValue := fmt.Sprintf("%s: %s", oidName, "up")
					nestedList[j] = append(nestedList[j], outputValue)
				} else if pdu.Value == 2 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Down")
					outputValue := fmt.Sprintf("%s: %s", oidName, "down")
					nestedList[j] = append(nestedList[j], outputValue)
				} else {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, pdu.Value)
					outputValue := fmt.Sprintf("%s: pduType-%s pduValue-%s", oidName, pduType, pdu.Value)
					nestedList[j] = append(nestedList[j], outputValue)
				}

			case ".1.3.6.1.2.1.2.2.1.8": // ifOperStatus
				oidName := "ifOperStatus"
				pduType := pdu.Type
				// fmt.Printf("iteration %v, %v ", j, i)
				if pdu.Value == 1 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Up")
					outputValue := fmt.Sprintf("%s: %s", oidName, "up")
					nestedList[j] = append(nestedList[j], outputValue)
				} else if pdu.Value == 2 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Down")
					outputValue := fmt.Sprintf("%s: %s", oidName, "down")
					nestedList[j] = append(nestedList[j], outputValue)
				} else if pdu.Value == 3 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Down")
					outputValue := fmt.Sprintf("%s: %s", oidName, "testing")
					nestedList[j] = append(nestedList[j], outputValue)
				} else if pdu.Value == 4 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Down")
					outputValue := fmt.Sprintf("%s: %s", oidName, "unknown")
					nestedList[j] = append(nestedList[j], outputValue)
				} else if pdu.Value == 5 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Down")
					outputValue := fmt.Sprintf("%s: %s", oidName, "dormant")
					nestedList[j] = append(nestedList[j], outputValue)
				} else if pdu.Value == 6 {
					// printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, "Down")
					outputValue := fmt.Sprintf("%s: %s", oidName, "notPresent")
					nestedList[j] = append(nestedList[j], outputValue)
				} else { // printResult("%s, OID is %s, PDU Type is %s, PDU value is: %d\n", oidName, rootOID, pduType, pdu.Value)
					outputValue := fmt.Sprintf("%s: pduType-%s pduValue-%s", oidName, pduType, pdu.Value)
					nestedList[j] = append(nestedList[j], outputValue)
				}

			default:
				pduType := pdu.Type
				// fmt.Printf("iteration %v, %v ", j, i)
				printResult("DEFAULT, PDU Type is %s, PDU value is: %d\n", rootOID, pduType, pdu.Value)
			}
		}
	}

	outputParsedMarshalled, err := json.MarshalIndent(nestedList, "", " ")
	if err != nil {
		log.Errorf("failed to marshal JSON: %v", err)
	}
	log.Debugf(string(outputParsedMarshalled))

	// Convert nested list to JSON
	// var result []map[string]PortInfo
	nodeMap := make(map[string][]PortInfo)
	newIndex := 0

	for _, item := range nestedList {

		if len(item) >= 2 && strings.Contains(item[5].(string), "ethernet-csmacd") {
			newIndex = newIndex + 1

			log.Debug(item[5].(string))

			// portIdString := ("index-" + (strconv.Itoa(newIndex)))
			info := PortInfo{}
			info.NodeName = targetAddress
			info.IfName = strings.SplitN(fmt.Sprintf("%v", item[1]), ": ", 2)[1]
			info.IfDescription = strings.SplitN(fmt.Sprintf("%v", item[2]), ": ", 2)[1]
			info.IfPhysAddress = strings.SplitN(fmt.Sprintf("%v", item[3]), ": ", 2)[1]
			info.IfMtu = strings.SplitN(fmt.Sprintf("%v", item[4]), ": ", 2)[1]
			info.IfType = strings.SplitN(fmt.Sprintf("%v", item[5]), ": ", 2)[1]
			info.IfAdminStatus = strings.SplitN(fmt.Sprintf("%v", item[6]), ": ", 2)[1]
			info.IfOperStatus = strings.SplitN(fmt.Sprintf("%v", item[7]), ": ", 2)[1]

			// result = append(result, map[string]PortInfo{portIdString: info})

			// result = append(result, map[string]PortInfo{portIdString: info})

			nodeMap[info.NodeName] = append(nodeMap[info.NodeName], info)

		}
	}

	// Convert result to JSON string
	// jsonData, err := json.MarshalIndent(result, "", "    ")
	// if err != nil {
	// 	fmt.Println("Error:", err)
	// }
	// log.Debug(string(jsonData))
	// return jsonData, err

	// Convert result to jsonDataNodeMap string
	jsonDataNodeMap, err := json.MarshalIndent(nodeMap, "", "    ")
	if err != nil {
		log.Errorf("Error: %s", err)
	}
	log.Debug(string(jsonDataNodeMap))
	return jsonDataNodeMap, nodeMap, err

}

func (cyTopo *CytoTopology) ParseCLIOutput(cliOutput []byte, nodeId, interfaceFilter string) (ClabNetemInterfaceData, error) {
	// Convert bytes to string
	cliOutputStr := string(cliOutput)
	lines := strings.Split(cliOutputStr, "\n")

	var results []ClabNetemInterfaceData

	// Split the input data into lines
	// Iterate over the lines to find and parse the relevant data for interfaceFilter
	for _, line := range lines {
		// Ignore the lines that are not data rows

		if !strings.HasPrefix(line, fmt.Sprintf("| %s", interfaceFilter)) {
			continue
		}

		// Split the line into fields

		log.Info(line)

		fields := strings.FieldsFunc(line, func(r rune) bool {
			return r == '|' || r == ' '
		})

		// Ensure we have enough fields
		if len(fields) < 5 {
			continue
		}

		// Create a new instance of ClabNetemInterfaceData and populate it
		data := ClabNetemInterfaceData{
			Node:       nodeId,
			Interface:  fields[0],
			Delay:      fields[1],
			Jitter:     fields[2],
			PacketLoss: fields[3],
			Rate:       fields[4],
		}

		// Append to the list of eth3 data
		results = append(results, data)
	}
	return results[0], nil
}
