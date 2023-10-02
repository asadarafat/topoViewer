package topoengine

type CytoTopology struct {
	CytoTopo                         CytoJsonTopology
	LogLevel                         uint32
	ClabTopoData                     ClabTopo
	ClabTopoDataV2                   ClabTopoV2
	IetfNetworSapTopoData            []byte
	IetfNetworL2TopoData             IetfNetworkTopologyL2
	IetfNetworL3TopoData             IetfNetworkTopologyL3
	IetfNetworkTopologyMultiL2L3Data []byte
	IetfNetworkTopologyGeneric       []byte
}

type CytoJsonTopology struct {
	Element []CytoJson `json:"element"`
}

type CytoJson struct {
	// Cytoscape Fields
	Data struct {
		ID             string `json:"id,omitempty"`
		Source         string `json:"source,omitempty"`
		Target         string `json:"target,omitempty"`
		Weight         string `json:"weight,omitempty"`
		Name           string `json:"name,omitempty"`
		Parent         string `json:"parent,omitempty"`
		Kind           string `json:"kind,omitempty"`
		TopoviewerRole string `json:"topoviewerRole"`
		SourceEndpoint string `json:"sourceEndpoint"`
		TargetEndpoint string `json:"targetEndpoint"`

		// Extra Fields
		ExtraData interface{} `json:"extraData,omitempty"`
	} `json:"data"`

	Pos struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
	Removed    bool   `json:"removed"`
	Group      string `json:"group"`
	Selected   bool   `json:"selected"`
	Selectable bool   `json:"selectable"`
	Locked     bool   `json:"locked"`
	Grabbed    bool   `json:"grabbed"`
	Grabbable  bool   `json:"grabbable"`
	Classes    string `json:"classes"`
}
