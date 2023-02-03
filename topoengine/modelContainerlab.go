package topoengine

import (
	// "github.com/srl-labs/containerlab/clab"
	// nodes "github.com/srl-labs/containerlab/nodes"
	types "github.com/srl-labs/containerlab/types"
)

// Containerlab Struct
type ClabTopo struct {
	ClabTopoName string     `json:"clabTopoName"`
	NodesList    []ClabNode `json:"nodes,omitempty"`
	LinksList    ClabLink   `json:"links,omitempty"`

	//ClabNodes          map[string]nodes.Node            `json:"clabNodes"`         // from clab Package needed to read topo file and write topo file
	ClabNodeDefinition map[string]*types.NodeDefinition `yaml:"clabNodesDefinition"` // from clab Package needed to read topo file and write topo file
	ClabLinks          map[int]*types.Link              `json:"clabLinks"`           // from clab Package needed to read topo file and write topo file
}

// Containerlab Json Struct
type ClabTopoStruct struct {
	Name      string              `json:"name"`
	Nodes     map[string]ClabNode `json:"nodes,omitempty"`
	ClabLinks map[int]ClabLink    `json:"links,omitempty"`
}

type ClabNode struct {
	types.ContainerDetails                        // from clab Package needed to read topo file and write topo file used for digitalTwin
	Data                   map[string]interface{} `json:"vars,omitempty"`
}

type ClabLink struct {
	// clab.Link            // from clab Package needed to read topo file and write topo file
	Endpoints []Endpoint `yaml:"endpoints"`
}

type Endpoint struct {
	Source         string `json:"source,omitempty"`
	SourceEndpoint string `json:"source_endpoint,omitempty"`
	Target         string `json:"target,omitempty"`
	TargetEndpoint string `json:"target_endpoint,omitempty"`
}
