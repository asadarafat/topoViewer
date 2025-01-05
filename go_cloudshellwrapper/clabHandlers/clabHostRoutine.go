// clabNodeBackupRestoree.go
package clabhandlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"path"
	"time"

	tools "github.com/asadarafat/topoViewer/go_tools"
	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	log "github.com/sirupsen/logrus"
)

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

func GetDockerNetworkNamespaceIDViaUnixSocket(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, deploymentType string, clabUser string, clabPass string, clabHost string, clabServerAddress string) {

	// Parse query parameters
	query := r.URL.Query()
	queriesList := make([]string, 0)
	for _, values := range query {
		queriesList = append(queriesList, values...)
	}

	if len(queriesList) < 1 {
		http.Error(w, "Invalid query parameters", http.StatusBadRequest)
		log.Info("Insufficient query parameters")
		return
	}

	containerID := queriesList[0]

	log.Infof("GetDockerNetworkNamespaceIDViaUnixSocket: containerID: %s", containerID)

	cli, err := client.NewClientWithOpts(client.WithHost("unix:///var/run/docker.sock"), client.WithAPIVersionNegotiation())
	if err != nil {
		http.Error(w, "Failed to create Docker client", http.StatusInternalServerError)
		log.Errorf("Failed to create Docker client: %v", err)
		return
	}
	defer cli.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	containerJSON, err := cli.ContainerInspect(ctx, containerID)
	if err != nil {
		http.Error(w, "Container not found or inaccessible", http.StatusNotFound)
		log.Errorf("Failed to inspect container: %v", err)
		return
	}

	containerPID := containerJSON.State.Pid
	if containerPID == 0 {
		http.Error(w, "Container is not running or PID is unavailable", http.StatusBadRequest)
		log.Errorf("Container PID is unavailable: %s", containerID)
		return
	}

	var netNamespaceID string
	nsPath := path.Join("/proc", fmt.Sprint(containerPID), "ns", "net")
	if deploymentType == "container" {

		command := fmt.Sprintf("readlink %s", nsPath)

		// Execute SSH command
		cliOutput, err := tools.SshSudo(clabHost, "22", clabUser, clabPass, clabServerAddress, command)
		if err != nil {
			log.Infof("Error executing SSH command: %v", err)
			http.Error(w, "Error executing SSH command", http.StatusInternalServerError)
			return
		}

		log.Infof("cliOutput: %s", cliOutput)

		netNamespaceID = string(cliOutput)

	} else { // colocated
		netNamespaceID, err = os.Readlink(nsPath)
		if err != nil {
			http.Error(w, "Failed to read network namespace link", http.StatusInternalServerError)
			log.Errorf("Failed to read network namespace link: %v", err)
			return
		}
	}

	response := map[string]string{
		"container_id": containerID,
		"namespace_id": netNamespaceID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Errorf("Failed to encode response: %v", err)
	}
}

func GetDockerNodeStatusViaUnixSocket(clabNodeName string, clabHost string) ([]byte, error) {
	log.Infof("Fetching Docker node status for: %s", clabNodeName)

	// Create Docker client
	cli, err := client.NewClientWithOpts(client.WithHost("unix:///var/run/docker.sock"), client.WithAPIVersionNegotiation())
	if err != nil {
		log.Errorf("Failed to create Docker client: %v", err)
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	// Set timeout for the request
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// List Docker containers
	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		log.Errorf("Failed to list Docker containers: %v", err)
		return nil, fmt.Errorf("failed to list Docker containers: %w", err)
	}

	// Iterate to find the matching container
	for _, container := range containers {
		if container.Names[0] == "/"+clabNodeName {
			// Construct DockerNodeStatus
			dockerNodeStatus := DockerNodeStatus{
				Command:      container.Command,
				CreatedAt:    container.Created,
				ID:           container.ID,
				Labels:       container.Labels,
				LocalVolumes: "", // Placeholder for future logic
				Mounts:       container.Mounts,
				Names:        strings.TrimPrefix(container.Names[0], "/"),
				Networks:     container.NetworkSettings,
				Ports:        container.Ports,
				RunningFor:   "", // Placeholder for future logic
				Size:         "", // Placeholder for future logic
				State:        container.State,
				Status:       container.Status,
			}

			// Marshal to JSON for transmission
			outputParsedMarshalled, err := json.MarshalIndent(dockerNodeStatus, "", "  ")
			if err != nil {
				log.Errorf("Failed to marshal Docker status: %v", err)
				return nil, fmt.Errorf("failed to marshal Docker status: %w", err)
			}

			return outputParsedMarshalled, nil
		}
	}

	log.Errorf("Docker node with name %s not found", clabNodeName)
	return nil, fmt.Errorf("docker node with name %s not found", clabNodeName)
}

// GetDockerConnectedInterfacesViaUnixSocket lists network interfaces in the source container connected to the target container
func GetDockerConnectedInterfacesViaUnixSocket(sourceContainer, targetContainer string) ([]byte, error) {
	// Step 1: Create a Docker client connected to the Unix socket
	cli, err := client.NewClientWithOpts(
		client.WithHost("unix:///var/run/docker.sock"),
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %v", err)
	}

	// Step 2: Get the container ID for the source container
	ctx := context.Background()
	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("error listing containers: %v", err)
	}

	var sourceContainerID, targetContainerID string
	for _, container := range containers {
		for _, name := range container.Names {
			if strings.Contains(name, sourceContainer) {
				sourceContainerID = container.ID
			}
			if strings.Contains(name, targetContainer) {
				targetContainerID = container.ID
			}
		}
	}

	if sourceContainerID == "" {
		return nil, fmt.Errorf("source container %s not found", sourceContainer)
	}

	if targetContainerID == "" {
		return nil, fmt.Errorf("target container %s not found", targetContainer)
	}

	// Helper function to run "ip link" in a container and return the output
	runIpLinkCommand := func(containerID string) (*bytes.Buffer, error) {

		// sudo docker exec -it clab-demo-ci-Spine-02 sh -c "ip -j link | jq"
		//
		// sample output:
		// [{
		// 	"ifindex": 1,
		// 	"ifname": "lo",
		// 	"flags": [
		// 		"LOOPBACK",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 65536,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UNKNOWN",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"txqlen": 1000,
		// 	"link_type": "loopback",
		// 	"address": "00:00:00:00:00:00",
		// 	"broadcast": "00:00:00:00:00:00"
		// },
		// {
		// 	"ifindex": 2,
		// 	"ifname": "dummy-mgmt0",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"NOARP"
		// 	],
		// 	"mtu": 1500,
		// 	"qdisc": "noop",
		// 	"operstate": "DOWN",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"txqlen": 1000,
		// 	"link_type": "ether",
		// 	"address": "7e:fa:6d:9c:e1:d8",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff"
		// },
		// {
		// 	"ifindex": 3,
		// 	"link_index": 3,
		// 	"ifname": "gway-2800",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 1500,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"txqlen": 1000,
		// 	"link_type": "ether",
		// 	"address": "82:be:2d:28:29:29",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 5
		// },
		// {
		// 	"ifindex": 5,
		// 	"link_index": 4,
		// 	"ifname": "monit_in",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 9234,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"txqlen": 1000,
		// 	"link_type": "ether",
		// 	"address": "62:57:56:22:37:c7",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 6
		// },
		// {
		// 	"ifindex": 6,
		// 	"link_index": 4,
		// 	"ifname": "mgmt0-0",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 1500,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"txqlen": 1000,
		// 	"link_type": "ether",
		// 	"address": "ee:2a:d7:70:da:93",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 5,
		// 	"ifalias": "mgmt0.0"
		// },
		// {
		// 	"ifindex": 5158,
		// 	"link_index": 5159,
		// 	"ifname": "mgmt0",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 1514,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"link_type": "ether",
		// 	"address": "02:42:ac:14:14:05",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 0
		// },
		// {
		// 	"ifindex": 5166,
		// 	"link_index": 5167,
		// 	"ifname": "e1-3",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 9232,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"link_type": "ether",
		// 	"address": "1a:38:04:ff:00:03",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 2
		// },
		// {
		// 	"ifindex": 5170,
		// 	"link_index": 5171,
		// 	"ifname": "e1-1",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 9232,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"link_type": "ether",
		// 	"address": "1a:38:04:ff:00:01",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 1
		// },
		// {
		// 	"ifindex": 5176,
		// 	"link_index": 5177,
		// 	"ifname": "e1-4",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 9232,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"link_type": "ether",
		// 	"address": "1a:38:04:ff:00:04",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 3
		// },
		// {
		// 	"ifindex": 5179,
		// 	"link_index": 5178,
		// 	"ifname": "e1-2",
		// 	"flags": [
		// 		"BROADCAST",
		// 		"MULTICAST",
		// 		"UP",
		// 		"LOWER_UP"
		// 	],
		// 	"mtu": 9232,
		// 	"qdisc": "noqueue",
		// 	"operstate": "UP",
		// 	"linkmode": "DEFAULT",
		// 	"group": "default",
		// 	"link_type": "ether",
		// 	"address": "1a:38:04:ff:00:02",
		// 	"broadcast": "ff:ff:ff:ff:ff:ff",
		// 	"link_netnsid": 4
		// }]

		execConfig := container.ExecOptions{
			Cmd:          []string{"ip", "-j", "link"},
			AttachStdout: true,
			AttachStderr: true,
		}
		execID, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create exec instance: %v", err)
		}

		response, err := cli.ContainerExecAttach(ctx, execID.ID, container.ExecStartOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to attach to exec instance: %v", err)
		}
		defer response.Close()

		var output bytes.Buffer
		_, err = stdcopy.StdCopy(&output, io.Discard, response.Reader)
		if err != nil {
			return nil, fmt.Errorf("failed to copy output: %v", err)
		}

		return &output, nil
	}

	// Run "ip link" inside the source and target containers
	sourceOutput, err := runIpLinkCommand(sourceContainerID)
	if err != nil {
		return nil, fmt.Errorf("failed to run ip link in source container: %v", err)
	}
	log.Infof("sourceOutput: %s", sourceOutput)

	targetOutput, err := runIpLinkCommand(targetContainerID)
	if err != nil {
		return nil, fmt.Errorf("failed to run ip link in target container: %v", err)
	}
	log.Infof("sourceOutput: %s", targetOutput)

	// Unmarshal into a slice of maps
	var sourceNodeInterfaces []map[string]interface{}
	err = json.Unmarshal([]byte(sourceOutput.Bytes()), &sourceNodeInterfaces)
	if err != nil {
		log.Errorf("Error unmarshaling input JSON: %v", err)
	}

	var targetNodeInterfaces []map[string]interface{}
	err = json.Unmarshal([]byte(targetOutput.Bytes()), &targetNodeInterfaces)
	if err != nil {
		log.Errorf("Error unmarshaling input JSON: %v", err)
	}

	// Slice to hold the mapped interfaces in the desired format
	var mappedInterfaces []map[string]interface{}

	// Iterate over the original interfaces and create the mapped structure
	for _, sourceIface := range sourceNodeInterfaces {

		// Skip if the sourceIface["ifname"] contains "gway-2800"
		if sourceIface["ifname"] == "gway-2800" {
			continue
		}
		for _, targetIface := range targetNodeInterfaces {

			if targetIface["ifindex"] == sourceIface["link_index"] {
				mapped := map[string]interface{}{
					"sourceClabNode": sourceContainer,
					"sourceIfIndex":  sourceIface["ifindex"],
					"sourceIfName":   sourceIface["ifname"],
					"sourceIfMac":    sourceIface["address"],
					"targetClabNode": targetContainer,
					"targetIfIndex":  targetIface["ifindex"],
					"targetIfName":   targetIface["ifname"],
					"targetIfMac":    targetIface["address"],
				}
				mappedInterfaces = append(mappedInterfaces, mapped)

			}
		}
	}

	// Marshal the mapped interfaces into JSON format
	outputJSON, err := json.MarshalIndent(mappedInterfaces, "", "  ")
	if err != nil {
		log.Errorf("Error marshaling output JSON: %v", err)
	}

	// Print the output JSON
	log.Debugf("output JSON: %s", string(outputJSON))

	// Return the result as a byte slice
	return outputJSON, nil
}

func GetDockerSubInterfacesViaUnixSocket(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology) {

	// Parse query parameters
	query := r.URL.Query()
	queriesList := make([]string, 0)
	for _, values := range query {
		queriesList = append(queriesList, values...)
	}

	if len(queriesList) < 1 {
		http.Error(w, "Invalid query parameters", http.StatusBadRequest)
		log.Info("Insufficient query parameters")
		return
	}

	containerID := queriesList[0]
	interfaceID := queriesList[1]

	// Step 1: Create a Docker client connected to the Unix socket
	cli, err := client.NewClientWithOpts(
		client.WithHost("unix:///var/run/docker.sock"),
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		log.Errorf("Failed to create Docker client: %v", err)
		return
	}

	// Step 2: Execute "ip -j link" inside the specified container
	ctx := context.Background()

	execConfig := container.ExecOptions{
		Cmd:          []string{"ip", "-j", "link"},
		AttachStdout: true,
		AttachStderr: true,
	}

	execID, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		log.Errorf("Failed to create exec instance: %v", err)
		return
	}

	response, err := cli.ContainerExecAttach(ctx, execID.ID, types.ExecStartCheck{})
	if err != nil {
		log.Errorf("Failed to attach to exec instance: %v", err)
		return
	}
	defer response.Close()

	var output bytes.Buffer
	_, err = stdcopy.StdCopy(&output, io.Discard, response.Reader)
	if err != nil {
		log.Errorf("Failed to copy output: %v", err)
		return
	}

	// Step 3: Parse JSON output
	var interfaces []map[string]interface{}
	err = json.Unmarshal(output.Bytes(), &interfaces)
	if err != nil {
		log.Errorf("Failed to unmarshal JSON: %v", err)
		return
	}

	// Step 4: Filter subinterfaces based on the prefix
	var subInterfaces []map[string]interface{}
	for _, iface := range interfaces {
		if ifname, ok := iface["ifname"].(string); ok && strings.HasPrefix(ifname, interfaceID+"-") {
			subInterfaces = append(subInterfaces, iface)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(subInterfaces); err != nil {
		log.Errorf("Failed to encode response: %v", err)
	}
}

// func GetDockerNetworkNamespaceIDViaUnixSocket(w http.ResponseWriter, r *http.Request, cyTopo *topoengine.CytoTopology, containerID string) {

// 	log.Infof("GetDockerNetworkNamespaceIDViaUnixSocket: containerID: %s", containerID)

// 	cli, err := client.NewClientWithOpts(client.WithHost("unix:///var/run/docker.sock"), client.WithAPIVersionNegotiation())
// 	if err != nil {
// 		http.Error(w, "Failed to create Docker client", http.StatusInternalServerError)
// 		log.Errorf("Failed to create Docker client: %v", err)
// 		return
// 	}
// 	defer cli.Close()

// 	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
// 	defer cancel()

// 	containerJSON, err := cli.ContainerInspect(ctx, containerID)
// 	if err != nil {
// 		http.Error(w, "Container not found or inaccessible", http.StatusNotFound)
// 		log.Errorf("Failed to inspect container: %v", err)
// 		return
// 	}

// 	containerPID := containerJSON.State.Pid
// 	if containerPID == 0 {
// 		http.Error(w, "Container is not running or PID is unavailable", http.StatusBadRequest)
// 		log.Errorf("Container PID is unavailable: %s", containerID)
// 		return
// 	}

// 	nsPath := path.Join("/proc", fmt.Sprint(containerPID), "ns", "net")
// 	netNamespaceID, err := os.Readlink(nsPath)
// 	if err != nil {
// 		http.Error(w, "Failed to read network namespace link", http.StatusInternalServerError)
// 		log.Errorf("Failed to read network namespace link: %v", err)
// 		return
// 	}

// 	response := map[string]string{
// 		"container_id": containerID,
// 		"namespace_id": netNamespaceID,
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusOK)
// 	if err := json.NewEncoder(w).Encode(response); err != nil {
// 		log.Errorf("Failed to encode response: %v", err)
// 	}
// }
