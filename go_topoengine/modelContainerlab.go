package topoengine

import types "github.com/srl-labs/containerlab/types"

// "github.com/srl-labs/containerlab/clab"
// nodes "github.com/srl-labs/containerlab/nodes"
// types "github.com/srl-labs/containerlab/types"

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
	ClabEndpoints []ClabEndpoint `yaml:"endpoints"`
}

type ClabEndpoint struct {
	ClabSource         string `json:"clabSource,omitempty"`
	ClabSourceEndpoint string `json:"clabSourceEndpoint,omitempty"`
	ClabTarget         string `json:"clabTarget,omitempty"`
	ClabTargetEndpoint string `json:"clabTargetEndpoint,omitempty"`
}
