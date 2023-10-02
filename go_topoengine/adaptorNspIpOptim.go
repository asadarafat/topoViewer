package topoengine

import (
	"encoding/json"
	"io/ioutil"
	"math/rand"
	"os"
	"strconv"

	tools "github.com/asadarafat/topoViewer/go_tools"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

type Hop struct {
	HopID            int         `json:"hopId"`
	HopLinkID        string      `json:"hopLinkId"`
	HopType          string      `json:"hopType"`
	SidHopType       interface{} `json:"sidHopType"`
	SegmentRouteType interface{} `json:"segmentRouteType"`
	IPAddress        struct {
		Ipv6Address interface{} `json:"ipv6Address"`
		Ipv4Address struct {
			String string `json:"string"`
		} `json:"ipv4Address"`
	} `json:"ipAddress"`
	IfLinkIndex interface{} `json:"ifLinkIndex"`
	RouterID    struct {
		DottedQuad struct {
			String string `json:"string"`
		} `json:"dottedQuad"`
	} `json:"routerId"`
	SegmentLabel                 int `json:"segmentLabel"`
	PostProcessedSourceInterface struct {
		Ipv6Address interface{} `json:"ipv6Address"`
		Ipv4Address struct {
			String string `json:"string"`
		} `json:"ipv4Address"`
	} `json:"postProcessedSourceInterface"`
	PostProcessedSourceTp interface{} `json:"postProcessedSourceTp"`
	PostProcessedSourceID struct {
		DottedQuad struct {
			String string `json:"string"`
		} `json:"dottedQuad"`
	} `json:"postProcessedSourceId"`
}

type IpOptimLsp struct {
	Response struct {
		Status    int `json:"status"`
		StartRow  int `json:"startRow"`
		EndRow    int `json:"endRow"`
		TotalRows int `json:"totalRows"`
		Data      []struct {
			PathName      string `json:"pathName"`
			PathID        string `json:"pathId"`
			LspID         string `json:"lspId"`
			TunnelID      int    `json:"tunnelId"`
			SourceID      string `json:"sourceId"`
			DestinationID string `json:"destinationId"`
			SourceAddress struct {
				Ipv6Address interface{} `json:"ipv6Address"`
				Ipv4Address struct {
					String string `json:"string"`
				} `json:"ipv4Address"`
			} `json:"sourceAddress"`
			DestinationAddress struct {
				Ipv6Address interface{} `json:"ipv6Address"`
				Ipv4Address struct {
					String string `json:"string"`
				} `json:"ipv4Address"`
			} `json:"destinationAddress"`
			SourceRouterAddress struct {
				Ipv6Address interface{} `json:"ipv6Address"`
				Ipv4Address struct {
					String string `json:"string"`
				} `json:"ipv4Address"`
			} `json:"sourceRouterAddress"`
			SourceNetworkName      []string `json:"sourceNetworkName"`
			DestinationNetworkName []string `json:"destinationNetworkName"`
			PathType               string   `json:"pathType"`
			CreationType           string   `json:"creationType"`
			ProtectionType         string   `json:"protectionType"`
			ProtectionState        string   `json:"protectionState"`
			ComputationState       string   `json:"computationState"`
			AdministrativeState    string   `json:"administrativeState"`
			OperationalState       string   `json:"operationalState"`
			LifecycleState         string   `json:"lifecycleState"`
			MaintenanceAffected    string   `json:"maintenanceAffected"`
			OwnershipState         struct {
				Ownership struct {
					Consumable bool `json:"consumable"`
					Modifiable bool `json:"modifiable"`
					Deletable  bool `json:"deletable"`
				} `json:"ownership"`
			} `json:"ownershipState"`
			ParamsConfig interface{} `json:"paramsConfig"`
			ParamsState  struct {
				PathParams struct {
					Objective              string      `json:"objective"`
					MaxCost                interface{} `json:"maxCost"`
					MaxHops                int         `json:"maxHops"`
					MaxTeMetric            interface{} `json:"maxTeMetric"`
					MaxLatency             interface{} `json:"maxLatency"`
					Bandwidth              int         `json:"bandwidth"`
					Msd                    interface{} `json:"msd"`
					SetupPriority          int         `json:"setupPriority"`
					PathProfile            interface{} `json:"pathProfile"`
					PathProfileOverride    interface{} `json:"pathProfileOverride"`
					TemplateID             int         `json:"templateId"`
					AssociationGroupPolicy struct {
					} `json:"associationGroupPolicy"`
					AssociationGroupDiversity struct {
					} `json:"associationGroupDiversity"`
					AdminGroupIncludeAll struct {
						AdminGroup struct {
							Binary []int `json:"binary"`
						} `json:"adminGroup"`
						ExtendedAdminGroup interface{} `json:"extendedAdminGroup"`
					} `json:"adminGroupIncludeAll"`
					AdminGroupIncludeAny struct {
						AdminGroup struct {
							Binary []int `json:"binary"`
						} `json:"adminGroup"`
						ExtendedAdminGroup interface{} `json:"extendedAdminGroup"`
					} `json:"adminGroupIncludeAny"`
					AdminGroupExcludeAny struct {
						AdminGroup struct {
							Binary []int `json:"binary"`
						} `json:"adminGroup"`
						ExtendedAdminGroup interface{} `json:"extendedAdminGroup"`
					} `json:"adminGroupExcludeAny"`
					MeasuredIPBwUpdateTimestamp interface{} `json:"measuredIpBwUpdateTimestamp"`
				} `json:"pathParams"`
			} `json:"paramsState"`
			ProvisionedHops interface{} `json:"provisionedHops"`
			ComputedHops    struct {
				PathHops struct {
					PathHop map[string]Hop `json:"pathHop"`
				} `json:"pathHops"`
			} `json:"computedHops"`
			RecordedHops struct {
				PathHops struct {
					PathHop map[string]Hop `json:"pathHop"`
				} `json:"pathHops"`
			} `json:"recordedHops"`
			AdministrativeFailureErrorCode string        `json:"administrativeFailureErrorCode"`
			PathErrorCode                  string        `json:"pathErrorCode"`
			Latency                        float64       `json:"latency"`
			InSync                         bool          `json:"inSync"`
			PathSearchBehaviorsInvoked     []interface{} `json:"pathSearchBehaviorsInvoked"`
		} `json:"data"`
	} `json:"response"`
}

func (cyTopo *CytoTopology) InitLoggerIpOptim() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopologyIetfMultiLayer.log", cyTopo.LogLevel)
}

// Read Lsp File
func (cyTopo *CytoTopology) IpOptimLspRead(topoFile string) []byte {
	filePath, _ := os.Getwd()
	filePath = (filePath + "/rawTopoFile/ipOptim-examples/")
	log.Info("topology file path: ", filePath)
	topoFileBytes, err := ioutil.ReadFile(filePath + "LSP-all.json")

	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	return topoFileBytes
}

// func (cyTopo *CytoTopology) IpOptimLspMarshall(topoFile []byte, lspPathNameTargetList []string, IpOptimLspData IpOptimLsp) []CytoJson {
func (cyTopo *CytoTopology) IpOptimLspMarshall(topoFile []byte, lspPathNameTarget string, IpOptimLspData IpOptimLsp) []CytoJson {

	err := json.Unmarshal(topoFile, &IpOptimLspData)
	if err != nil {
		log.Error("Error:", err)
	}

	palette := []string{"#7d33f2", "#dc32f2", "#f27d32", "#f2dc32", "#32f27d", "#32f2dc", "#F27D33", "#33F27D"}

	log.Info(palette)

	cytoJsonNode := CytoJson{}
	cytoJsonEdge := CytoJson{}
	cytoJsonEdgeMultiLayer := CytoJson{}

	cytoJsonList := []CytoJson{}
	// cytoJsonEdgeMultiLayerList := []CytoJson{}
	// cytoJsonEdgeMultiLayerListNoDuplicate := []CytoJson{}

	// // Seed the random number generator
	// rand.Seed(time.Now().UnixNano())

	for _, lspPath := range IpOptimLspData.Response.Data {
		var prevHop Hop
		var emptyHop Hop

		if lspPath.PathName == lspPathNameTarget {
			if lspPath.PathType == "RSVP" {
				// assinged color
				value := rand.Float64() * 100
				assignedColor := cyTopo.AssignColor(value, palette)
				cytoJsonEdge.Data.Source = ""

				lenght := len(lspPath.RecordedHops.PathHops.PathHop)
				for i := 1; i <= lenght; i++ {
					// add LSP Node
					cytoJsonNode.Group = "nodes"
					cytoJsonNode.Grabbable = true
					cytoJsonNode.Selectable = true
					cytoJsonNode.Data.ID = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String //taken by cyto as index
					cytoJsonNode.Data.Weight = "3"
					cytoJsonNode.Data.Name = lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonNode.Data.Parent = "Transport-Tunnel"
					cytoJsonNode.Data.Kind = "LayerTransportTunnelNode"
					cytoJsonNode.Data.TopoviewerRole = ""
					cytoJsonNode.Data.ExtraData = map[string]interface{}{
						"networkID":      "",
						"networkName":    "",
						"nodeAttributes": lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)],
					}
					cytoJsonList = append(cytoJsonList, cytoJsonNode)

					// add LSP Link
					// as RSVP recordedHops.hop1 data is empty then need to do check prevHop != emptyHop
					if prevHop != emptyHop {
						cytoJsonEdge.Group = "edges"
						cytoJsonEdge.Grabbable = true
						cytoJsonEdge.Selectable = true
						cytoJsonEdge.Data.ID = uuid.NewString()
						cytoJsonEdge.Data.Weight = "1"
						cytoJsonEdge.Data.Source = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i-1)].RouterID.DottedQuad.String
						cytoJsonEdge.Data.Target = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
						cytoJsonEdge.Data.Name = "LSP--" + cytoJsonEdge.Data.Source + "---" + cytoJsonEdge.Data.Target
						cytoJsonEdge.Data.Kind = "LayerTransportTunnelLink"
						cytoJsonEdge.Data.ExtraData = map[string]interface{}{
							"color":         assignedColor,
							"pathHopNumber": strconv.Itoa(i),
							"lspPathDetail": lspPath,
						}
						cytoJsonList = append(cytoJsonList, cytoJsonEdge)
					}

					prevHop = lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)]
					log.Info("prevHopEnd: " + prevHop.RouterID.DottedQuad.String)

					// add Linkage between L2 and LSP Nodes

					cytoJsonEdgeMultiLayer.Group = "edges"
					cytoJsonEdgeMultiLayer.Grabbable = true
					cytoJsonEdgeMultiLayer.Selectable = true
					cytoJsonEdgeMultiLayer.Data.ID = uuid.NewString()
					cytoJsonEdgeMultiLayer.Data.Weight = "1"
					cytoJsonEdgeMultiLayer.Data.Source = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonEdgeMultiLayer.Data.Target = "L2-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonEdgeMultiLayer.Data.Name = "MultiLayer--" + cytoJsonEdgeMultiLayer.Data.Source + "---" + cytoJsonEdgeMultiLayer.Data.Target
					cytoJsonEdgeMultiLayer.Data.Kind = "MultiLayerLink"
					cytoJsonEdgeMultiLayer.Data.ExtraData = map[string]interface{}{
						"networkID":   "",
						"networkName": "",
					}
					cytoJsonList = append(cytoJsonList, cytoJsonEdgeMultiLayer)
				}
			} else if lspPath.PathType == "SRTE" {
				// assinged color
				value := rand.Float64() * 100
				assignedColor := cyTopo.AssignColor(value, palette)
				cytoJsonEdge.Data.Source = ""

				lenght := len(lspPath.RecordedHops.PathHops.PathHop)
				for i := 1; i <= lenght; i++ {
					// add LSP Node
					cytoJsonNode.Group = "nodes"
					cytoJsonNode.Grabbable = true
					cytoJsonNode.Selectable = true
					cytoJsonNode.Data.ID = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String //taken by cyto as index
					cytoJsonNode.Data.Weight = "3"
					cytoJsonNode.Data.Name = lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonNode.Data.Parent = "Transport-Tunnel"
					cytoJsonNode.Data.Kind = "LayerTransportTunnelNode"
					cytoJsonNode.Data.TopoviewerRole = ""
					cytoJsonNode.Data.ExtraData = map[string]interface{}{
						"networkID":      "",
						"networkName":    "",
						"nodeAttributes": lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)],
					}
					cytoJsonList = append(cytoJsonList, cytoJsonNode)

					// add LSP Link
					cytoJsonEdge.Group = "edges"
					cytoJsonEdge.Grabbable = true
					cytoJsonEdge.Selectable = true
					cytoJsonEdge.Data.ID = uuid.NewString()
					cytoJsonEdge.Data.Weight = "1"
					cytoJsonEdge.Data.Source = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].PostProcessedSourceID.DottedQuad.String
					cytoJsonEdge.Data.Target = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonEdge.Data.Name = "LSP--" + cytoJsonEdge.Data.Source + "---" + cytoJsonEdge.Data.Target
					cytoJsonEdge.Data.Kind = "LayerTransportTunnelLink"
					cytoJsonEdge.Data.ExtraData = map[string]interface{}{
						"color":         assignedColor,
						"pathHopNumber": strconv.Itoa(i),
						"lspPathDetail": lspPath,
					}
					cytoJsonList = append(cytoJsonList, cytoJsonEdge)

					prevHop = lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)]
					log.Info("prevHopEnd: " + prevHop.RouterID.DottedQuad.String)

					// add Linkage between L2 and LSP Nodes
					cytoJsonEdgeMultiLayer.Group = "edges"
					cytoJsonEdgeMultiLayer.Grabbable = true
					cytoJsonEdgeMultiLayer.Selectable = true
					cytoJsonEdgeMultiLayer.Data.ID = uuid.NewString()
					cytoJsonEdgeMultiLayer.Data.Weight = "1"
					cytoJsonEdgeMultiLayer.Data.Source = "LSP-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonEdgeMultiLayer.Data.Target = "L2-" + lspPath.RecordedHops.PathHops.PathHop[strconv.Itoa(i)].RouterID.DottedQuad.String
					cytoJsonEdgeMultiLayer.Data.Name = "MultiLayer--" + cytoJsonEdgeMultiLayer.Data.Source + "---" + cytoJsonEdgeMultiLayer.Data.Target
					cytoJsonEdgeMultiLayer.Data.Kind = "MultiLayerLink"
					cytoJsonEdgeMultiLayer.Data.ExtraData = map[string]interface{}{
						"networkID":   "",
						"networkName": "",
					}
					cytoJsonList = append(cytoJsonList, cytoJsonEdgeMultiLayer)
				}

			}
		}

		// add LSP parent Node
		cytoJsonNode.Group = "nodes"
		cytoJsonNode.Grabbable = true
		cytoJsonNode.Selectable = true
		cytoJsonNode.Data.ID = "Transport-Tunnel" //taken by cyto as index
		cytoJsonNode.Data.Weight = "3"
		cytoJsonNode.Data.Name = "Transport-Tunnel"
		cytoJsonNode.Data.Kind = ""
		cytoJsonNode.Data.Parent = ""
		cytoJsonNode.Data.ExtraData = map[string]interface{}{
			"nodeAttributes": struct {
				name string
			}{"LSP"},
		}
		cytoJsonList = append(cytoJsonList, cytoJsonNode)

	}

	// Create a map to track unique names
	uniqueNames := make(map[string]bool)
	uniquePeople := []CytoJson{}

	// Iterate over the parsed data and filter out duplicates
	for _, cytoJson := range cytoJsonList {
		if !uniqueNames[cytoJson.Data.Name] {
			uniqueNames[cytoJson.Data.Name] = true

			uniquePeople = append(uniquePeople, cytoJson)
		}
	}

	return uniquePeople
}
