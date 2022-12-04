package topoengine

import (
	"github.com/srl-labs/containerlab/clab"
	nodes "github.com/srl-labs/containerlab/nodes"
	types "github.com/srl-labs/containerlab/types"
)

// Containerlab Struct
type ClabTopo struct {
	ClabTopoName   string                           `json:"clabTopoName"`
	ClabNodes      map[string]nodes.Node            `json:"clabNodes"`           // from clab Package needed to read topo file and write topo file
	NodeDefinition map[string]*types.NodeDefinition `yaml:"clabNodesDefinition"` // from clab Package needed to read topo file and write topo file
	ClabLinks      map[int]*types.Link              `json:"clabLinks"`           // from clab Package needed to read topo file and write topo file
}

// Containerlab Json Struct
type ClabTopoJson struct {
	Name  string                  `json:"name"`
	Nodes map[string]ClabNodeJson `json:"nodes,omitempty"`
	Links map[int]ClabLinkJson    `json:"links,omitempty"`
}
type ClabNodeJson struct {
	types.ContainerDetails
	Vars map[string]interface{} `json:"vars,omitempty"`
}

type ClabLinkJson struct {
	clab.Link
	Vars map[string]interface{} `json:"vars,omitempty"`
}
