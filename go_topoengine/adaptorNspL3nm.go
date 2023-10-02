package topoengine

import (
	"io/ioutil"
	"os"

	tools "github.com/asadarafat/topoViewer/go_tools"
	log "github.com/sirupsen/logrus"
)

type L3nm struct {
	IetfL3VpnNtwVpnService []struct {
		VpnID              string      `json:"vpn-id"`
		VpnName            string      `json:"vpn-name"`
		VpnDescription     string      `json:"vpn-description"`
		CustomerName       string      `json:"customer-name"`
		ParentServiceID    interface{} `json:"parent-service-id"`
		VpnType            string      `json:"vpn-type"`
		VpnServiceTopology string      `json:"vpn-service-topology"`
		Status             struct {
		} `json:"status"`
		VpnInstanceProfiles struct {
			VpnInstanceProfile []struct {
				ProfileID     string      `json:"profile-id"`
				Role          string      `json:"role"`
				LocalAs       interface{} `json:"local-as"`
				AddressFamily []struct {
					AddressFamily string `json:"address-family"`
					VpnTargets    struct {
						VpnPolicies struct {
							ImportPolicy string `json:"import-policy"`
							ExportPolicy string `json:"export-policy"`
						} `json:"vpn-policies"`
					} `json:"vpn-targets"`
				} `json:"address-family"`
				Rd string `json:"rd"`
			} `json:"vpn-instance-profile"`
		} `json:"vpn-instance-profiles"`
		UnderlayTransport struct {
			Protocol []string `json:"protocol"`
		} `json:"underlay-transport"`
		ExternalConnectivity struct {
		} `json:"external-connectivity"`
		VpnNodes struct {
			VpnNode []struct {
				VpnNodeID                 string      `json:"vpn-node-id"`
				Description               string      `json:"description"`
				NeID                      string      `json:"ne-id"`
				LocalAs                   interface{} `json:"local-as"`
				RouterID                  string      `json:"router-id"`
				ActiveVpnInstanceProfiles struct {
					VpnInstanceProfile []struct {
						ProfileID string      `json:"profile-id"`
						LocalAs   interface{} `json:"local-as"`
					} `json:"vpn-instance-profile"`
				} `json:"active-vpn-instance-profiles"`
				Groups struct {
				} `json:"groups"`
				Status struct {
					AdminStatus struct {
						Status     string      `json:"status"`
						LastChange interface{} `json:"last-change"`
					} `json:"admin-status"`
				} `json:"status"`
				VpnNetworkAccesses struct {
					VpnNetworkAccess []struct {
						ID                   string      `json:"id"`
						InterfaceID          string      `json:"interface-id"`
						Description          string      `json:"description"`
						VpnNetworkAccessType string      `json:"vpn-network-access-type"`
						VpnInstanceProfile   interface{} `json:"vpn-instance-profile"`
						Status               struct {
						} `json:"status"`
						Connection struct {
							L2TerminationPoint   interface{} `json:"l2-termination-point"`
							LocalBridgeReference interface{} `json:"local-bridge-reference"`
							BearerReference      interface{} `json:"bearer-reference"`
							Encapsulation        struct {
								Type  string `json:"type"`
								Dot1Q struct {
									TagType string `json:"tag-type"`
									CvlanID int    `json:"cvlan-id"`
								} `json:"dot1q"`
							} `json:"encapsulation"`
						} `json:"connection"`
						IPConnection struct {
							L3TerminationPoint interface{} `json:"l3-termination-point"`
							Ipv4               struct {
								LocalAddress          string      `json:"local-address"`
								PrefixLength          int         `json:"prefix-length"`
								AddressAllocationType interface{} `json:"address-allocation-type"`
							} `json:"ipv4"`
						} `json:"ip-connection"`
						RoutingProtocols struct {
						} `json:"routing-protocols"`
						Oam struct {
						} `json:"oam"`
						Security struct {
							EncryptionProfile struct {
							} `json:"encryption-profile"`
						} `json:"security"`
						Service struct {
							PeToCeBandwidth interface{} `json:"pe-to-ce-bandwidth"`
							CeToPeBandwidth interface{} `json:"ce-to-pe-bandwidth"`
							Mtu             int         `json:"mtu"`
							Qos             struct {
								QosClassificationPolicy struct {
									Rule []interface{} `json:"rule"`
								} `json:"qos-classification-policy"`
								QosAction struct {
									Rule []interface{} `json:"rule"`
								} `json:"qos-action"`
								QosProfile struct {
									QosProfile []interface{} `json:"qos-profile"`
								} `json:"qos-profile"`
							} `json:"qos"`
						} `json:"service"`
					} `json:"vpn-network-access"`
				} `json:"vpn-network-accesses"`
			} `json:"vpn-node"`
		} `json:"vpn-nodes"`
	} `json:"ietf-l3vpn-ntw:vpn-service"`
}

func (cyTopo *CytoTopology) InitLoggerL3nm() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopologyIetfMultiLayer.log", cyTopo.LogLevel)
}

// Read Lsp File
func (cyTopo *CytoTopology) L3nmRead(topoFile string) []byte {
	filePath, _ := os.Getwd()
	filePath = (filePath + "/rawTopoFile/ietf-topo-examples/")
	log.Info("topology file path: ", filePath)
	topoFileBytes, err := ioutil.ReadFile(filePath + "LSP-all.json")

	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	return topoFileBytes
}
