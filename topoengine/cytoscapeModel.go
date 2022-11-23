package topoengine

type CytoTopology struct {
	CytoTopo             CytoJsonTopology
	LogLevel             uint32
	ClabTopoData         ClabTopo
	IetfNetworL2TopoData []byte
	IetfNetworL3TopoData []byte
}

type CytoJsonTopology struct {
	Element []CytoJson `json:"element"`
}

type CytoJson struct {
	// Cytoscape Fields
	Data struct {
		ID     string `json:"id"`
		Source string `json:"source,omitempty"`
		Target string `json:"target,omitempty"`
		Weight string `json:"weight"`
		Name   string `json:"name"`
		// Extra Fields
		Endpoint struct {
			SourceEndpoint string `json:"sourceEndpoint"`
			TargetEndpoint string `json:"targetEndpoint"`
		} `json:"endpoint"`
		ExtraData interface{} `json:"ExtraData,omitempty"`
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
