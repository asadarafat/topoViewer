package topoengine

import (
	"encoding/json"
	"os"

	log "github.com/sirupsen/logrus"
)

// Marshalled cytoJsonList to JSON Data format.
func (cyTopo *CytoTopology) MarshallCytoJsonList(cytoJsonList []CytoJson) []byte {
	jsonBytesCytoUiMarshalled, err := json.MarshalIndent(cytoJsonList, "", "  ")
	if err != nil {
		log.Error(err)
		panic(err)
	}

	_, err = os.Stdout.Write(jsonBytesCytoUiMarshalled)
	if err != nil {
		log.Error(err)
		panic(err)
	}
	return jsonBytesCytoUiMarshalled
}

func (cyTopo *CytoTopology) AssignColor(value float64, palette []string) string {
	// Normalize the value to fit within the range of the palette
	minVal := 0.0
	maxVal := 100.0
	normalized := (value - minVal) / (maxVal - minVal)

	// Calculate the index in the palette based on the normalized value
	index := int(normalized * float64(len(palette)))

	// Ensure the index stays within bounds
	if index < 0 {
		index = 0
	} else if index >= len(palette) {
		index = len(palette) - 1
	}

	// Return the assigned color
	return palette[index]
}
