package main

import (
	// tools "github.com/asadarafat/topoViewer/go_tools"

	log "github.com/sirupsen/logrus"

	tools "github.com/asadarafat/topoViewer/go_tools"
	topoengine "github.com/asadarafat/topoViewer/go_topoengine"
)

// // "io/ioutil"
// // "os"

// type Connection struct {
// 	*ssh.Client
// 	password string
// }

// func Connect(addr, user, password string) (*Connection, error) {
// 	sshConfig := &ssh.ClientConfig{
// 		User: user,
// 		Auth: []ssh.AuthMethod{
// 			ssh.Password(password),
// 		},
// 		HostKeyCallback: ssh.HostKeyCallback(func(hostname string, remote net.Addr, key ssh.PublicKey) error { return nil }),
// 	}

// 	conn, err := ssh.Dial("tcp", addr, sshConfig)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &Connection{conn, password}, nil

// }

// func (conn *Connection) SendCommands(cmds ...string) ([]byte, error) {
// 	session, err := conn.NewSession()
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	defer session.Close()

// 	modes := ssh.TerminalModes{
// 		ssh.ECHO:          0,     // disable echoing
// 		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
// 		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
// 	}

// 	err = session.RequestPty("xterm", 80, 40, modes)
// 	if err != nil {
// 		return []byte{}, err
// 	}

// 	in, err := session.StdinPipe()
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	out, err := session.StdoutPipe()
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	var output []byte

// 	go func(in io.WriteCloser, out io.Reader, output *[]byte) {
// 		var (
// 			line string
// 			r    = bufio.NewReader(out)
// 		)
// 		for {
// 			b, err := r.ReadByte()
// 			if err != nil {
// 				break
// 			}

// 			*output = append(*output, b)

// 			if b == byte('\n') {
// 				line = ""
// 				continue
// 			}

// 			line += string(b)

// 			if strings.HasPrefix(line, "[sudo] password for ") && strings.HasSuffix(line, ": ") {
// 				_, err = in.Write([]byte(conn.password + "\n"))
// 				if err != nil {
// 					break
// 				}
// 			}
// 		}
// 	}(in, out, &output)

// 	cmd := strings.Join(cmds, "; ")
// 	_, err = session.Output(cmd)
// 	if err != nil {
// 		return []byte{}, err
// 	}

//		return output, nil
//	}
func main() {

	cytoUiGo := topoengine.CytoTopology{}
	cytoUiGo.LogLevel = 5
	cytoUiGo.InitLogger()

	// cytoUiGo.InitLoggerDigitalTwin()

	// clab run
	// cytoUiGo.MarshalContainerLabTopo("clab-topo-file.yaml")
	// clabTopoJson := topoengine.ClabTopoJson{}
	// cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// jsonBytes := cytoUiGo.UnmarshalContainerLabTopo(clabTopoJson)
	// // log.Info(jsonBytes)
	// cytoUiGo.PrintjsonBytesCytoUi(jsonBytes)

	// Nsp Ietf L2
	// Nsp Ietf L2
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// log.Info(topoFile)
	// cytoUiGo.IetfL2TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL2{})
	// jsonBytesL2 := cytoUiGo.IetfL2TopoUnMarshal(topoFile, topoengine.IetfNetworkTopologyL2{})
	// cytoUiGo.IetfL2TopoPrintjsonBytesCytoUi(jsonBytesL2)

	// Nsp Ietf L3
	// Nsp Ietf L3
	// var topoFileList []string

	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:55000:2-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:65000:1-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-1:65000:1-isis.json")
	// log.Info(topoFileList)
	// topoFileByte0 := cytoUiGo.IetfL3TopoRead(topoFileList[0])
	// topoFileByte1 := cytoUiGo.IetfL3TopoRead(topoFileList[1])
	// topoFileByte2 := cytoUiGo.IetfL3TopoRead(topoFileList[2])

	// var topoL3FileByteCombine [][]byte
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte0)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte1)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte2)

	// log.Info(topoFileByteCombine)
	// jsonBytesL3 := cytoUiGo.IetfL3TopoUnMarshal(topoFileByteCombine, topoengine.IetfNetworkTopologyL3{})
	// cytoUiGo.IetfL3TopoPrintjsonBytesCytoUi(jsonBytesL3)

	// // Nsp Ietf Multi L2 L3
	// // Nsp Ietf Multi L2 L3
	// // load L2 topo nya dulu
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// topoFileL2 := topoFile

	// // load L3 topo nya dulu
	// var topoFileList []string
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:55000:2-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-0:65000:1-isis.json")
	// topoFileList = append(topoFileList, "rawTopoFile/topo-ietf-L3-TopologyId-1:65000:1-isis.json")
	// log.Info(topoFileList)
	// topoFileByte0 := cytoUiGo.IetfL3TopoRead(topoFileList[0])
	// topoFileByte1 := cytoUiGo.IetfL3TopoRead(topoFileList[1])
	// topoFileByte2 := cytoUiGo.IetfL3TopoRead(topoFileList[2])

	// var topoL3FileByteCombine [][]byte
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte0)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte1)
	// topoL3FileByteCombine = append(topoL3FileByteCombine, topoFileByte2)

	// jsonBytesMultiL2L3 := cytoUiGo.IetfMultiL2L3TopoUnMarshal(topoFileL2, topoL3FileByteCombine, topoengine.IetfNetworkTopologyMultiL2L3{})
	// cytoUiGo.IetfMultiLayerTopoPrintjsonBytesCytoUi(jsonBytesMultiL2L3)

	// // Nsp digitalTwin
	// // Nsp digitalTwin
	// // Nsp digitalTwin
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// // log.Info(topoFile)
	// cytoUiGo.NspDigitalTwinTopoUnmarshal(topoFile, topoengine.IetfNetworkTopologyL2{})

	// Nsp digitalTwin
	// Nsp digitalTwin
	// Nsp digitalTwin
	// // filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "topo-ietf-L2.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }
	// // log.Info(topoFile)
	// cytoUiGo.NspDigitalTwinTopoUnmarshal(topoFile, topoengine.IetfNetworkTopologyL2{})

	//// clabv2 run
	//// clabv2 run

	// cytoUiGo.InitLoggerClabV2()
	// topoFileBytes := cytoUiGo.ClabTopoRead("rawTopoFile/clab/bng-cups/clab-cups/topology-data.json")
	// //topoFileBytes := cytoUiGo.ClabTopoRead("rawTopoFile/clab-Vodafone-CO-HCO/topology-data.json")

	// jsonBytesCytoUi := cytoUiGo.UnmarshalContainerLabTopoV2(topoFileBytes)
	// cytoUiGo.PrintjsonBytesCytoUiV2(jsonBytesCytoUi)

	// cytoUiGo.GetDockerNodeStatus("clab-Vodafone-CO-HCO-R01-PE")

	// // NEW Nsp Ietf Multi L2 L3
	// // NEW Nsp Ietf Multi L2 L3
	// // load L2 topo nya dulu
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/ietf-topo-examples/")
	// log.Info("topology file path: ", filePath)
	// topoFile, err := ioutil.ReadFile(filePath + "ietf-all-networks.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }

	// var payload map[string]interface{}
	// var SAPtopoFile []byte
	// var L2topoFile []byte
	// var L3topoFileList [][]byte

	// err = json.Unmarshal(topoFile, &payload)
	// if err != nil {
	// 	fmt.Println("Error:", err)
	// 	return
	// }

	// networkList := len(payload["ietf-network:networks"].(map[string]interface{})["network"].([]interface{}))

	// for i := range payload["ietf-network:networks"].(map[string]interface{})["network"].([]interface{}) {
	// 	// fmt.Println("networkType: ", payload["ietf-network:networks"].(map[string]interface{})["network"].([]interface{})[i].(map[string]interface{})["network-types"].(map[string]interface{}))

	// 	returnValueNetworkType := payload["ietf-network:networks"].(map[string]interface{})["network"].([]interface{})[i].(map[string]interface{})["network-types"].(map[string]interface{})
	// 	returnValueNetworkData := payload["ietf-network:networks"].(map[string]interface{})["network"].([]interface{})[i].(map[string]interface{})

	// 	// Check if any key contains the target substring
	// 	for key := range returnValueNetworkType {
	// 		if strings.Contains(key, "ietf-l3-unicast-topology:l3-unicast-topology") {
	// 			log.Debugf("A key containing '%s' was found.\n", "ietf-l3-unicast-topology:l3-unicast-topology")
	// 			// Marshal the map into a JSON string
	// 			jsonBytes, err := json.Marshal(returnValueNetworkData)
	// 			if err != nil {
	// 				fmt.Println("Error:", err)
	// 				return
	// 			}
	// 			L3topoFileList = append(L3topoFileList, jsonBytes)

	// 		} else if strings.Contains(key, "ietf-l2-topology:l2-topology") {
	// 			log.Debugf("A key containing '%s' was found.\n", "ietf-l2-topology:l2-topology")
	// 			// Marshal the map into a JSON string
	// 			jsonBytes, err := json.Marshal(returnValueNetworkData)
	// 			if err != nil {
	// 				fmt.Println("Error:", err)
	// 				return
	// 			}
	// 			L2topoFile = jsonBytes
	// 			log.Info("JSON L2topoFileList:", string(L2topoFile))

	// 		} else if strings.Contains(key, "ietf-sap-ntw:sap-network") {
	// 			log.Debugf("A key containing '%s' was found.\n", "ietf-sap-ntw:sap-network")
	// 			// Marshal the map into a JSON string
	// 			jsonBytes, err := json.Marshal(returnValueNetworkData)
	// 			if err != nil {
	// 				fmt.Println("Error:", err)
	// 				return
	// 			}
	// 			SAPtopoFile = jsonBytes
	// 			log.Info("JSON L2topoFileList:", string(SAPtopoFile))

	// 		}
	// 	}
	// }

	// log.Info("JSON L3topoFileList01:", string(L3topoFileList[0]))
	// log.Info("JSON L3topoFileList02:", string(L3topoFileList[1]))
	// log.Info("JSON L3topoFileList03:", string(L3topoFileList[2]))
	// log.Info("networkList: ", networkList)
	// // cytoUiGo.IetfNetworSapTopoData = SAPtopoFile
	// // cytoUiGo.IetfNetworL2TopoData = L2topoFile
	// // cytoUiGo.IetfNetworL3TopoData = L3topoFileList

	// cytoUiGo.IetfL2TopoUnMarshal(L2topoFile, cytoUiGo.IetfNetworL2TopoData)
	// cytoUiGo.IetfL3TopoUnMarshal(L3topoFileList, cytoUiGo.IetfNetworL3TopoData)

	// LOAD IETF TOPO
	// LOAD IETF TOPO
	// topoFile := "ietf-all-networks.json"

	// MultiL2L3TopoBytes := cytoUiGo.IetfMultiL2L3TopoReadV2(topoFile)
	// MultiL2L3TopoMarshalled := cytoUiGo.IetfMultiL2L3TopoUnMarshalV2(MultiL2L3TopoBytes, topoengine.IetfNetworkTopologyMultiL2L3{})

	// fmt.Println("Marshal MultiL2L3TopoMarshalled: " + string(MultiL2L3TopoMarshalled))

	// var jsonData []map[string]interface{}

	// err := json.Unmarshal(MultiL2L3TopoMarshalledL2, &jsonData)
	// if err != nil {
	// 	fmt.Println("Error decoding JSON:", err)
	// 	return
	// }

	// outputData := map[string][]map[string]interface{}{
	// 	"ietf-network:network": jsonData,
	// }

	// outputJSON, err := json.MarshalIndent(outputData, "", "    ")
	// if err != nil {
	// 	fmt.Println("Error encoding JSON:", err)
	// 	return
	// }

	// fmt.Println(string("outputJSON"))
	// fmt.Println(string(outputJSON))

	// var IetfNetworkTopologyL2Data topoengine.IetfNetworkTopologyL2
	// json.Unmarshal(outputJSON, &IetfNetworkTopologyL2Data)

	// cytoUiGo.IetfL2TopoUnMarshal(outputJSON, IetfNetworkTopologyL2Data)

	// // L2 Working
	// jsonBytes := cytoUiGo.IetfL2TopoUnMarshal(MultiL2L3TopoMarshalledL2, topoengine.IetfNetworkTopologyL2{})
	// fmt.Println("Marshal L2TopoFileBytes" + string(jsonBytes[:]))

	// string(myBytes[:])
	// // fmt.Println((L2string))
	// // fmt.Print(("L3: "))
	// // fmt.Println((L3))

	////// LSP load
	////// LSP load
	// const jsonPayload = `{
	// 	"response": {
	// 		"status": 0,
	// 		"startRow": 0,
	// 		"endRow": 0,
	// 		"totalRows": 1,
	// 		"data": [
	// 			{
	// 				"pathName": "pccRsvp-from-10.10.10.1-to-10.10.10.7::LOOSE",
	// 				"pathId": "197-fff712a6-ded7-437e-a255-e2c8995c2d3a",
	// 				"lspId": "10651-665f6e8b-602b-4db3-991a-5e0d637ca2d0",
	// 				"tunnelId": 6,
	// 				"sourceId": "70-3baa0d78-c71d-4311-b49a-9f7f3b46cb60",
	// 				"destinationId": "10162-30ac647f-5b7e-4539-a42c-93c16ed776ae",
	// 				"sourceAddress": {
	// 					"ipv6Address": null,
	// 					"ipv4Address": {
	// 						"string": "10.10.10.1"
	// 					}
	// 				},
	// 				"destinationAddress": {
	// 					"ipv6Address": null,
	// 					"ipv4Address": {
	// 						"string": "10.10.10.7"
	// 					}
	// 				},
	// 				"sourceRouterAddress": {
	// 					"ipv6Address": null,
	// 					"ipv4Address": {
	// 						"string": "192.168.100.31"
	// 					}
	// 				},
	// 				"sourceNetworkName": [
	// 					"0:65000:1"
	// 				],
	// 				"destinationNetworkName": [
	// 					"BGP-0:65000:0",
	// 					"0:65000:1"
	// 				],
	// 				"pathType": "RSVP",
	// 				"creationType": "REQUESTED",
	// 				"protectionType": "UNKNOWN",
	// 				"protectionState": "ACTIVE",
	// 				"computationState": "PATH_FOUND",
	// 				"administrativeState": "UP",
	// 				"operationalState": "UP",
	// 				"lifecycleState": "Deployed",
	// 				"maintenanceAffected": "NONE",
	// 				"ownershipState": {
	// 					"ownership": {
	// 						"consumable": true,
	// 						"modifiable": true,
	// 						"deletable": false
	// 					}
	// 				},
	// 				"paramsConfig": null,
	// 				"paramsState": {
	// 					"pathParams": {
	// 						"objective": "COST",
	// 						"maxCost": null,
	// 						"maxHops": 0,
	// 						"maxTeMetric": null,
	// 						"maxLatency": null,
	// 						"bandwidth": 0,
	// 						"msd": null,
	// 						"setupPriority": 7,
	// 						"pathProfile": null,
	// 						"pathProfileOverride": null,
	// 						"templateId": 0,
	// 						"associationGroupPolicy": {},
	// 						"associationGroupDiversity": {},
	// 						"adminGroupIncludeAll": {
	// 							"adminGroup": {
	// 								"binary": [
	// 									0,
	// 									0,
	// 									0,
	// 									0
	// 								]
	// 							},
	// 							"extendedAdminGroup": null
	// 						},
	// 						"adminGroupIncludeAny": {
	// 							"adminGroup": {
	// 								"binary": [
	// 									0,
	// 									0,
	// 									0,
	// 									0
	// 								]
	// 							},
	// 							"extendedAdminGroup": null
	// 						},
	// 						"adminGroupExcludeAny": {
	// 							"adminGroup": {
	// 								"binary": [
	// 									0,
	// 									0,
	// 									0,
	// 									0
	// 								]
	// 							},
	// 							"extendedAdminGroup": null
	// 						},
	// 						"measuredIpBwUpdateTimestamp": null
	// 					}
	// 				},
	// 				"provisionedHops": null,
	// 				"computedHops": {
	// 					"pathHops": {
	// 						"pathHop": {
	// 							"1": {
	// 								"hopIndex": 1,
	// 								"hopId": 1,
	// 								"hopLinkId": null,
	// 								"hopType": "STRICT",
	// 								"sidHopType": null,
	// 								"segmentRouteType": null,
	// 								"ipAddress": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.1.3.2"
	// 									}
	// 								},
	// 								"ifLinkIndex": null,
	// 								"routerId": null,
	// 								"segmentLabel": 0,
	// 								"postProcessedSourceInterface": null,
	// 								"postProcessedSourceTp": null,
	// 								"postProcessedSourceId": null
	// 							},
	// 							"2": {
	// 								"hopIndex": 2,
	// 								"hopId": 2,
	// 								"hopLinkId": null,
	// 								"hopType": "STRICT",
	// 								"sidHopType": null,
	// 								"segmentRouteType": null,
	// 								"ipAddress": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.3.7.1"
	// 									}
	// 								},
	// 								"ifLinkIndex": null,
	// 								"routerId": null,
	// 								"segmentLabel": 0,
	// 								"postProcessedSourceInterface": null,
	// 								"postProcessedSourceTp": null,
	// 								"postProcessedSourceId": null
	// 							}
	// 						}
	// 					}
	// 				},
	// 				"recordedHops": {
	// 					"pathHops": {
	// 						"pathHop": {
	// 							"1": {
	// 								"hopIndex": 1,
	// 								"hopId": 1,
	// 								"hopLinkId": "1488-39bdad39-c31d-455b-92df-9ecf6c999d79",
	// 								"hopType": "STRICT",
	// 								"sidHopType": null,
	// 								"segmentRouteType": null,
	// 								"ipAddress": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.1.3.1"
	// 									}
	// 								},
	// 								"ifLinkIndex": null,
	// 								"routerId": {
	// 									"dottedQuad": {
	// 										"string": "10.10.10.1"
	// 									}
	// 								},
	// 								"segmentLabel": 0,
	// 								"postProcessedSourceInterface": null,
	// 								"postProcessedSourceTp": null,
	// 								"postProcessedSourceId": null
	// 							},
	// 							"2": {
	// 								"hopIndex": 2,
	// 								"hopId": 2,
	// 								"hopLinkId": "5793-400aff94-0a8c-4aa6-82dc-6c98683dda27",
	// 								"hopType": "STRICT",
	// 								"sidHopType": null,
	// 								"segmentRouteType": null,
	// 								"ipAddress": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.1.3.2"
	// 									}
	// 								},
	// 								"ifLinkIndex": null,
	// 								"routerId": {
	// 									"dottedQuad": {
	// 										"string": "10.10.10.3"
	// 									}
	// 								},
	// 								"segmentLabel": 524278,
	// 								"postProcessedSourceInterface": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.1.3.1"
	// 									}
	// 								},
	// 								"postProcessedSourceTp": null,
	// 								"postProcessedSourceId": {
	// 									"dottedQuad": {
	// 										"string": "10.10.10.1"
	// 									}
	// 								}
	// 							},
	// 							"3": {
	// 								"hopIndex": 3,
	// 								"hopId": 3,
	// 								"hopLinkId": "10344-03c21b2b-3caa-4a68-a89c-4c50126fa00d",
	// 								"hopType": "STRICT",
	// 								"sidHopType": null,
	// 								"segmentRouteType": null,
	// 								"ipAddress": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.3.7.1"
	// 									}
	// 								},
	// 								"ifLinkIndex": null,
	// 								"routerId": {
	// 									"dottedQuad": {
	// 										"string": "10.10.10.7"
	// 									}
	// 								},
	// 								"segmentLabel": 524209,
	// 								"postProcessedSourceInterface": {
	// 									"ipv6Address": null,
	// 									"ipv4Address": {
	// 										"string": "10.3.7.2"
	// 									}
	// 								},
	// 								"postProcessedSourceTp": null,
	// 								"postProcessedSourceId": {
	// 									"dottedQuad": {
	// 										"string": "10.10.10.3"
	// 									}
	// 								}
	// 							}
	// 						}
	// 					}
	// 				},
	// 				"administrativeFailureErrorCode": "NO_ERROR",
	// 				"pathErrorCode": "NO_ERROR",
	// 				"latency": 0.0,
	// 				"inSync": true,
	// 				"pathSearchBehaviorsInvoked": []
	// 			}
	// 		]
	// 	}
	// }`

	// // result := gjson.Get(jsonPayload, "response.data.#.recordedHops.pathHops")
	// // println(result.String())

	// // result.ForEach(func(key, value gjson.Result) bool {
	// // 	println(value.String())
	// // 	return true // keep iterating
	// // })
	// type Hop struct {
	// 	HopID            int         `json:"hopId"`
	// 	HopLinkID        string      `json:"hopLinkId"`
	// 	HopType          string      `json:"hopType"`
	// 	SidHopType       interface{} `json:"sidHopType"`
	// 	SegmentRouteType interface{} `json:"segmentRouteType"`
	// 	IPAddress        struct {
	// 		Ipv6Address interface{} `json:"ipv6Address"`
	// 		Ipv4Address struct {
	// 			String string `json:"string"`
	// 		} `json:"ipv4Address"`
	// 	} `json:"ipAddress"`
	// 	IfLinkIndex interface{} `json:"ifLinkIndex"`
	// 	RouterID    struct {
	// 		DottedQuad struct {
	// 			String string `json:"string"`
	// 		} `json:"dottedQuad"`
	// 	} `json:"routerId"`
	// 	SegmentLabel                 int `json:"segmentLabel"`
	// 	PostProcessedSourceInterface struct {
	// 		Ipv6Address interface{} `json:"ipv6Address"`
	// 		Ipv4Address struct {
	// 			String string `json:"string"`
	// 		} `json:"ipv4Address"`
	// 	} `json:"postProcessedSourceInterface"`
	// 	PostProcessedSourceTp interface{} `json:"postProcessedSourceTp"`
	// 	PostProcessedSourceID struct {
	// 		DottedQuad struct {
	// 			String string `json:"string"`
	// 		} `json:"dottedQuad"`
	// 	} `json:"postProcessedSourceId"`
	// }

	// type IpOptimLsp struct {
	// 	Response struct {
	// 		Status    int `json:"status"`
	// 		StartRow  int `json:"startRow"`
	// 		EndRow    int `json:"endRow"`
	// 		TotalRows int `json:"totalRows"`
	// 		Data      []struct {
	// 			PathName      string `json:"pathName"`
	// 			PathID        string `json:"pathId"`
	// 			LspID         string `json:"lspId"`
	// 			TunnelID      int    `json:"tunnelId"`
	// 			SourceID      string `json:"sourceId"`
	// 			DestinationID string `json:"destinationId"`
	// 			SourceAddress struct {
	// 				Ipv6Address interface{} `json:"ipv6Address"`
	// 				Ipv4Address struct {
	// 					String string `json:"string"`
	// 				} `json:"ipv4Address"`
	// 			} `json:"sourceAddress"`
	// 			DestinationAddress struct {
	// 				Ipv6Address interface{} `json:"ipv6Address"`
	// 				Ipv4Address struct {
	// 					String string `json:"string"`
	// 				} `json:"ipv4Address"`
	// 			} `json:"destinationAddress"`
	// 			SourceRouterAddress struct {
	// 				Ipv6Address interface{} `json:"ipv6Address"`
	// 				Ipv4Address struct {
	// 					String string `json:"string"`
	// 				} `json:"ipv4Address"`
	// 			} `json:"sourceRouterAddress"`
	// 			SourceNetworkName      []string `json:"sourceNetworkName"`
	// 			DestinationNetworkName []string `json:"destinationNetworkName"`
	// 			PathType               string   `json:"pathType"`
	// 			CreationType           string   `json:"creationType"`
	// 			ProtectionType         string   `json:"protectionType"`
	// 			ProtectionState        string   `json:"protectionState"`
	// 			ComputationState       string   `json:"computationState"`
	// 			AdministrativeState    string   `json:"administrativeState"`
	// 			OperationalState       string   `json:"operationalState"`
	// 			LifecycleState         string   `json:"lifecycleState"`
	// 			MaintenanceAffected    string   `json:"maintenanceAffected"`
	// 			OwnershipState         struct {
	// 				Ownership struct {
	// 					Consumable bool `json:"consumable"`
	// 					Modifiable bool `json:"modifiable"`
	// 					Deletable  bool `json:"deletable"`
	// 				} `json:"ownership"`
	// 			} `json:"ownershipState"`
	// 			ParamsConfig interface{} `json:"paramsConfig"`
	// 			ParamsState  struct {
	// 				PathParams struct {
	// 					Objective              string      `json:"objective"`
	// 					MaxCost                interface{} `json:"maxCost"`
	// 					MaxHops                int         `json:"maxHops"`
	// 					MaxTeMetric            interface{} `json:"maxTeMetric"`
	// 					MaxLatency             interface{} `json:"maxLatency"`
	// 					Bandwidth              int         `json:"bandwidth"`
	// 					Msd                    interface{} `json:"msd"`
	// 					SetupPriority          int         `json:"setupPriority"`
	// 					PathProfile            interface{} `json:"pathProfile"`
	// 					PathProfileOverride    interface{} `json:"pathProfileOverride"`
	// 					TemplateID             int         `json:"templateId"`
	// 					AssociationGroupPolicy struct {
	// 					} `json:"associationGroupPolicy"`
	// 					AssociationGroupDiversity struct {
	// 					} `json:"associationGroupDiversity"`
	// 					AdminGroupIncludeAll struct {
	// 						AdminGroup struct {
	// 							Binary []int `json:"binary"`
	// 						} `json:"adminGroup"`
	// 						ExtendedAdminGroup interface{} `json:"extendedAdminGroup"`
	// 					} `json:"adminGroupIncludeAll"`
	// 					AdminGroupIncludeAny struct {
	// 						AdminGroup struct {
	// 							Binary []int `json:"binary"`
	// 						} `json:"adminGroup"`
	// 						ExtendedAdminGroup interface{} `json:"extendedAdminGroup"`
	// 					} `json:"adminGroupIncludeAny"`
	// 					AdminGroupExcludeAny struct {
	// 						AdminGroup struct {
	// 							Binary []int `json:"binary"`
	// 						} `json:"adminGroup"`
	// 						ExtendedAdminGroup interface{} `json:"extendedAdminGroup"`
	// 					} `json:"adminGroupExcludeAny"`
	// 					MeasuredIPBwUpdateTimestamp interface{} `json:"measuredIpBwUpdateTimestamp"`
	// 				} `json:"pathParams"`
	// 			} `json:"paramsState"`
	// 			ProvisionedHops interface{} `json:"provisionedHops"`
	// 			ComputedHops    struct {
	// 				PathHops struct {
	// 					PathHop map[string]Hop `json:"pathHop"`
	// 				} `json:"pathHops"`
	// 			} `json:"computedHops"`
	// 			RecordedHops struct {
	// 				PathHops struct {
	// 					PathHop map[string]Hop `json:"pathHop"`
	// 				} `json:"pathHops"`
	// 			} `json:"recordedHops"`
	// 			AdministrativeFailureErrorCode string        `json:"administrativeFailureErrorCode"`
	// 			PathErrorCode                  string        `json:"pathErrorCode"`
	// 			Latency                        float64       `json:"latency"`
	// 			InSync                         bool          `json:"inSync"`
	// 			PathSearchBehaviorsInvoked     []interface{} `json:"pathSearchBehaviorsInvoked"`
	// 		} `json:"data"`
	// 	} `json:"response"`
	// }

	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/ipOptim-examples/")
	// log.Info("topology file path: ", filePath)
	// lspFileBytes, err := ioutil.ReadFile(filePath + "LSP-all.json")

	// if err != nil {
	// 	log.Fatal("Error when opening file: ", err)
	// }

	// lspStruct := IpOptimLsp{}

	// err = json.Unmarshal(lspFileBytes, &lspStruct)
	// if err != nil {
	// 	log.Error("Error:", err)
	// }

	// lspPathNameTarget := "pccRsvp-from-10.10.10.1-to-10.10.10.7::LOOSE"

	// cytoJsonNode := topoengine.CytoJson{}
	// cytoJsonEdge := topoengine.CytoJson{}

	// cytoJsonList := []topoengine.CytoJson{}

	// // var prevKey string
	// var prevHop Hop
	// var emptyHop Hop

	// for _, lspPath := range lspStruct.Response.Data {
	// 	if lspPath.PathName == lspPathNameTarget {
	// 		fmt.Println("found")
	// 		for _, hop := range lspPath.RecordedHops.PathHops.PathHop {
	// 			log.Info("router Id: ")
	// 			log.Info(hop.RouterID.DottedQuad.String)

	// 			log.Info("outGoing IP Interface: ")
	// 			log.Info(hop.IPAddress.Ipv4Address.String)

	// 			// add LSP Node
	// 			cytoJsonNode.Group = "nodes"
	// 			cytoJsonNode.Grabbable = true
	// 			cytoJsonNode.Selectable = true
	// 			cytoJsonNode.Data.ID = "LSP-" + hop.RouterID.DottedQuad.String //taken by cyto as index
	// 			cytoJsonNode.Data.Weight = "3"
	// 			cytoJsonNode.Data.Name = "LSP-" + hop.RouterID.DottedQuad.String
	// 			cytoJsonNode.Data.Parent = "LSP"
	// 			cytoJsonNode.Data.TopoviewerRole = "pe"
	// 			cytoJsonEdge.Data.Kind = "TransportLayerNode"
	// 			cytoJsonNode.Data.ExtraData = map[string]interface{}{
	// 				"networkID":      "",
	// 				"networkName":    "",
	// 				"nodeAttributes": hop,
	// 			}
	// 			cytoJsonList = append(cytoJsonList, cytoJsonNode)

	// 			// add LSP Link
	// 			if prevHop != emptyHop {
	// 				cytoJsonEdge.Group = "edges"
	// 				cytoJsonEdge.Grabbable = true
	// 				cytoJsonEdge.Selectable = true
	// 				cytoJsonEdge.Data.ID = uuid.NewString()
	// 				cytoJsonEdge.Data.Weight = "1"
	// 				cytoJsonEdge.Data.Source = "LSP-" + prevHop.RouterID.DottedQuad.String
	// 				cytoJsonEdge.Data.Target = "LSP-" + hop.RouterID.DottedQuad.String
	// 				cytoJsonEdge.Data.Name = "LSP--" + cytoJsonEdge.Data.Source + "---" + cytoJsonEdge.Data.Target
	// 				cytoJsonEdge.Data.Kind = "TransportLayerLink"
	// 				cytoJsonEdge.Data.ExtraData = map[string]interface{}{
	// 					"LSPname": lspPathNameTarget,
	// 				}
	// 				cytoJsonList = append(cytoJsonList, cytoJsonEdge)
	// 			}
	// 			prevHop = hop
	// 			// add Linkage between L2 and LSP Nodes

	// 			cytoJsonEdge.Group = "edges"
	// 			cytoJsonEdge.Grabbable = true
	// 			cytoJsonEdge.Selectable = true
	// 			cytoJsonEdge.Data.ID = uuid.NewString()
	// 			cytoJsonEdge.Data.Weight = "1"
	// 			cytoJsonEdge.Data.Source = "LSP-" + hop.RouterID.DottedQuad.String
	// 			cytoJsonEdge.Data.Target = "L2-" + hop.RouterID.DottedQuad.String
	// 			cytoJsonEdge.Data.Name = "MultiLayer--" + cytoJsonEdge.Data.Source + "---" + cytoJsonEdge.Data.Target
	// 			cytoJsonEdge.Data.Kind = "MultiLayerLink"
	// 			cytoJsonEdge.Data.ExtraData = map[string]interface{}{
	// 				"networkID":   "",
	// 				"networkName": "",
	// 			}
	// 			cytoJsonList = append(cytoJsonList, cytoJsonEdge)
	// 		}

	// 		// add LSP parent Node
	// 		cytoJsonNode.Group = "nodes"
	// 		cytoJsonNode.Grabbable = true
	// 		cytoJsonNode.Selectable = true
	// 		cytoJsonNode.Data.ID = "Transport Tunnel" //taken by cyto as index
	// 		cytoJsonNode.Data.Weight = "3"
	// 		cytoJsonNode.Data.Name = "LSP"
	// 		cytoJsonNode.Data.Parent = ""
	// 		cytoJsonNode.Data.TopoviewerRole = "parent"
	// 		cytoJsonNode.Data.ExtraData = map[string]interface{}{
	// 			"nodeAttributes": struct {
	// 				name string
	// 			}{"LSP"},
	// 		}
	// 		cytoJsonList = append(cytoJsonList, cytoJsonNode)

	// 	}
	// }

	// jsonBytesCytoUi, err := json.MarshalIndent(cytoJsonList, "", "  ")
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }

	// _, err = os.Stdout.Write(jsonBytesCytoUi)
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }

	// // test L2NM
	// // test L2NM
	// // test L2NM
	// // test L2NM
	// IetfL2nm := topoengine.L2Nm{}

	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/ietf-topo-examples/")
	// log.Info("topology file path: ", filePath)
	// topoFileBytes, err := ioutil.ReadFile(filePath + "ietf-l2nm-evpn.json")

	// log.Error(err)
	// log.Info(topoFileBytes)

	// err = json.Unmarshal(topoFileBytes, &IetfL2nm.VpnService)
	// if err != nil {
	// 	log.Error("Error:", err)
	// }

	// // log.Info(topoFileBytes)
	// // log.Info(IetfL2nm)

	// // Throw unmarshalled result to log
	// jsonBytesIetfL2nm, err := json.MarshalIndent(IetfL2nm, "", "  ")
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }

	// _, err = os.Stdout.Write(jsonBytesIetfL2nm)
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }

	// // tools.CommentProcessor("./html-public/demo/button.html", "./html-static/template/clab/button.tmpl")
	//// ini penting
	tools.CommentProcessor("./html-public/nokia-ServiceProvider/button.html", "./html-static/template/clab/button.tmpl")

	// cytoUiGo.GetDockerNodeStatusViaUnixSocket("clab-3tierSmall-dcgw-1", "localhost")

	// var neHost = "149.204.21.68"
	// var nePort = "22"
	// var neUser = "aarafat"
	// var nePass = "!Wulandar100"
	// var cmd1 = "sudo clab inspect --all"

	// // Command to execute the Python script
	// cmd := exec.Command("python3", "./html-static/actions/exampleScript.py", "arg1", "arg2")
	// // cmd := exec.Command("whoami")

	// // Capture standard output and error
	// out, err := cmd.CombinedOutput()
	// if err != nil {
	// 	log.Fatalf("Failed to execute Python script: %v", err)
	// }

	// // Print the output
	// fmt.Printf("Python script output:\n%s\n", out)

	// // ssh refers to the custom package above
	// conn, err := Connect(neHost+":"+nePort, neUser, nePass)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// output, err := conn.SendCommands("sudo clab inspect --all", "sudo /usr/bin/containerlab tools netem set -n clab-nokia-ServiceProvider-R06-PE-ASBR -i eth3 --delay 5000ms --jitter 0ms --rate 0 --loss 0")
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// fmt.Println(string(output))

	// tools.SshSudo(neHost, nePort, neUser, nePass, cmd1)

	////
	cyTopo := topoengine.CytoTopology{}
	toolLogger := tools.Logs{}

	cyTopo.InitLogger()
	cyTopo.LogLevel = uint32(toolLogger.MapLogLevelStringToNumber("debug"))
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)

	backupDirectory := "/var/asad/topoViewer/html-public/nokia-ServiceProvider/node-backup/clab-nokia-ServiceProvider-R09-PE-ASBR"
	// err := cyTopo.NodeConfigBackup(
	// 	"vr-sros",
	// 	"10.2.1.109",
	// 	"admin",
	// 	"admin",
	// 	"backup.cfg",
	// 	backupDirectory,
	// 	"backup",
	// )

	err := cyTopo.NodeConfigBackupRestore(
		"vr-sros",
		"10.2.1.109",
		"admin",
		"admin",
		"clab-nokia-ServiceProvider-R09-PE-ASBR-running.cfg",
		backupDirectory,
		"restore",
	)

	// time=2024-07-14T13:37:57Z level=info msg=requestData-param1-param1DataString: {"routerKind":"vr-sros","routerID":"10.2.1.109","routerUserName":"admin","routerPassword":"admin","backupPath":"/var/asad/topoViewer/html-public/nokia-ServiceProvider/node-backup/clab-nokia-ServiceProvider-R09-PE-ASBR","action":"backup"}

	if err != nil {
		log.Errorf("Failed to execute device operation: %v", err)
	}
}
