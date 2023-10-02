package topoengine

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	// "os/user"
	"path"
	"strconv"
	"strings"

	// "time"

	"github.com/samber/lo"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"

	tools "github.com/asadarafat/topoViewer/go_tools"
)

func (cyTopo *CytoTopology) InitLogger() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) MarshalContainerLabTopov1(topoFile string) error {
	clabNode := ClabNode{}
	workingDirectory, err1 := os.Getwd()
	if err1 != nil {
		message := fmt.Sprintf("failed to get working directory: %s", err1)
		log.Error(message)
		return errors.New(message)
	}

	// topo file handling
	fullFilePath := path.Join(workingDirectory + "/" + topoFile)
	fullFilePathSplit := strings.Split(fullFilePath, "/")
	log.Infof("fullFilePathSplit  : '%s'", fullFilePathSplit)
	fileName := fullFilePathSplit[len(fullFilePathSplit)-1]
	fullFilePathWithoutFileName := strings.Trim(fullFilePath, fullFilePathSplit[len(fullFilePathSplit)-1])
	log.Infof("ConfigFileName  : '%s'", fileName)

	// viper loading topo config
	viper.SetConfigName(fileName)                    // name of config file (without extension)
	viper.SetConfigType("yaml")                      // REQUIRED if the config file does not have the extension in the name
	viper.AddConfigPath(fullFilePathWithoutFileName) // path to look for the config file in

	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}
	log.Infof("viper All keys    : '%s'", viper.AllKeys())

	// initiate list
	var nodesNames []string
	var NodesList []ClabNode

	// build node names list
	for _, i := range viper.AllKeys() {
		if strings.Contains(i, "topology.nodes") {
			log.Infof("viper keys    : '%s'", viper.Get(i))

			nodeName := strings.Split(i, ".")
			nodesNames = append(nodesNames, nodeName[2])
		}
	}
	nodesNames = tools.RemoveDuplicateNodesValues(nodesNames)
	log.Infof("All Nodes Name    : '%s'", nodesNames)

	// build nodes Nodes(with attributes))List based on nodesNames
	for _, nodeName := range nodesNames {
		for _, i := range viper.AllKeys() {
			// log.Infof("Nokdes Names : '%s'", nodeName)
			// log.Infof("viper key    : '%s'", viper.AllKeys()[k])
			// log.Infof("viper value  : '%s'", viper.Get(i))
			fmt.Println(i, viper.Get(i))
			clabNode.Data = map[string]interface{}{
				"clabName":            nodeName,
				"clabImage":           viper.Get("topology.nodes." + nodeName + ".image"),
				"clabKind":            viper.Get("topology.nodes." + nodeName + ".kind"),
				"clabMgmtIPv4Address": viper.Get("topology.nodes." + nodeName + ".mgmt_ipv4"),
				"clabBinds":           viper.Get("topology.nodes." + nodeName + ".binds"),
				"clabTopoviewerRole":  viper.Get("topology.nodes." + nodeName + ".topoviewer.role"),
				"clabTopoviewerColor": viper.Get("topology.nodes." + nodeName + ".topoviewer.color"),
			}
		}
		NodesList = append(NodesList, clabNode)
	}
	cyTopo.ClabTopoData.NodesList = NodesList
	log.Infof("cyTopo.ClabTopoData.NodesList    : '%s'", cyTopo.ClabTopoData.NodesList)

	endpoint := ClabEndpoint{}
	LinksList := ClabLink{}
	for _, i := range viper.AllKeys() {
		if strings.Contains(i, "topology.links") {
			log.Debug("###### Convert viper Endpoints data from type []interface{} to []string")
			log.Debugf("###### Convert viper Endpoints from type []interface{} to []string, value of Raw Viper Endpoints Data  : '%s'", viper.Get(i))

			result := viper.Get(i)
			mResult := result.([]interface{})
			for i := range mResult {
				nResult := mResult[i]
				oResult := nResult.(map[interface{}]interface{})
				mapString := make(map[string]interface{})
				for key, value := range oResult {
					strKey := fmt.Sprintf("%v", key)
					strValue := fmt.Sprintf("%v", value)
					mapString[strKey] = strValue
				}

				endpointRaw := fmt.Sprint(mapString["endpoints"])
				endpointRaw = strings.ToLower(endpointRaw)
				endpointRaw = endpointRaw[:len(endpointRaw)-1] // remove last char ("]") from the endpointRaw string
				endpointRaw = endpointRaw[1:]                  // remove first char ("]") from the endpointRaw string

				endpoint.ClabSource = strings.Split(strings.Split(endpointRaw, " ")[0], ":")[0]
				endpoint.ClabSourceEndpoint = strings.Split(strings.Split(endpointRaw, " ")[0], ":")[1]
				endpoint.ClabTarget = strings.Split(strings.Split(endpointRaw, " ")[1], ":")[0]
				endpoint.ClabTargetEndpoint = strings.Split(strings.Split(endpointRaw, " ")[1], ":")[1]

				log.Infof("####endpoint.Source   : '%s'", endpoint.ClabSource)
				log.Infof("####endpoint.SourceEndpoint   : '%s'", endpoint.ClabSourceEndpoint)
				log.Infof("####endpoint.Target   : '%s'", endpoint.ClabTarget)
				log.Infof("####endpoint.TargetEndpoint   : '%s'", endpoint.ClabTargetEndpoint)

				LinksList.ClabEndpoints = append(LinksList.ClabEndpoints, endpoint)
			}
		}
	}

	cyTopo.ClabTopoData.LinksList = LinksList
	log.Infof("cyTopo.ClabTopoData.LinksList    : '%s'", cyTopo.ClabTopoData.LinksList)

	cyTopo.ClabTopoData.ClabTopoName = viper.Get("name").(string)
	log.Infof("cyTopo.ClabTopoData.ClabTopoName    : '%s'", cyTopo.ClabTopoData.ClabTopoName)

	return nil
}

func (cyTopo *CytoTopology) UnmarshalContainerLabTopov1(ClabTopoStruct ClabTopoStruct, ServerHostUser string) []byte {

	var topoviewerRoleList []string

	cytoJson := CytoJson{}
	cytoJsonArray := []CytoJson{}

	// // get ServerHost Username
	// user, err := user.Current()
	// if err != nil {
	// 	log.Error(err.Error())
	// }
	// Username := user.Username
	Username := ServerHostUser

	for _, n := range cyTopo.ClabTopoData.NodesList {

		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = n.Data["clabName"].(string)
		cytoJson.Data.Name = n.Data["clabName"].(string)                     // get the Node name by accessing direct via Interface
		cytoJson.Data.TopoviewerRole = n.Data["clabTopoviewerRole"].(string) // get the Node name by accessing direct via Interface
		cytoJson.Data.Weight = "2"
		cytoJson.Data.ExtraData = n.Data // copy all attribute of clab n.Data to cyto ExtraData
		switch cytoJson.Data.TopoviewerRole {
		case "dcgw":
			cytoJson.Data.Parent = "datacenter"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
			cytoJson.Data.Parent = "ip-mpls"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		case "superSpine":
			cytoJson.Data.Parent = "datacenter"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		case "spine":
			cytoJson.Data.Parent = "datacenter"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		case "leaf":
			cytoJson.Data.Parent = "datacenter"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		case "pe":
			cytoJson.Data.Parent = "ip-mpls"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		case "p":
			cytoJson.Data.Parent = "ip-mpls"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		case "ppe":
			cytoJson.Data.Parent = "ip-mpls"
			topoviewerRoleList = append(topoviewerRoleList, cytoJson.Data.Parent)
		}

		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}

	uniqtopoviewerRoleList := lo.Uniq(topoviewerRoleList)
	log.Debugf("uniqtopoviewerRoleList: ", uniqtopoviewerRoleList)

	// add Parent Nodes Per topoviewerRoleList
	for _, n := range uniqtopoviewerRoleList {
		cytoJson.Group = "nodes"
		cytoJson.Data.Parent = ""
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = n
		cytoJson.Data.Name = n + " domain"
		cytoJson.Data.TopoviewerRole = n
		cytoJson.Data.Weight = "2"
		cytoJson.Data.ExtraData = ""

		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}

	for i, l := range cyTopo.ClabTopoData.LinksList.ClabEndpoints {

		cytoJson.Group = "edges"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = strconv.Itoa(i)
		cytoJson.Data.Weight = "1"
		cytoJson.Data.Name = l.ClabSource + "::" + l.ClabSourceEndpoint + " <--> " + l.ClabTarget + "::" + l.ClabTargetEndpoint
		cytoJson.Data.Source = l.ClabSource
		//cytoJson.Data.Endpoint.SourceEndpoint = l.SourceEndpoint
		cytoJson.Data.Target = l.ClabTarget
		//cytoJson.Data.Endpoint.TargetEndpoint = l.TargetEndpoint

		cytoJson.Data.SourceEndpoint = l.ClabSourceEndpoint
		cytoJson.Data.TargetEndpoint = l.ClabTargetEndpoint

		cytoJson.Data.ExtraData = map[string]interface{}{
			"clabServerUsername": Username,
			"clabKind":           "ClabLink",
			"clabId":             strconv.Itoa(i),
			"clabName":           l.ClabSource + "::" + l.ClabSourceEndpoint + " <--> " + l.ClabTarget + "::" + l.ClabTargetEndpoint,
			"clabSourceLongName": "clab" + "-" + cyTopo.ClabTopoData.ClabTopoName + "-" + l.ClabSource,
			"clabTargetLongName": "clab" + "-" + cyTopo.ClabTopoData.ClabTopoName + "-" + l.ClabTarget,
			"clabEndpoints": struct {
				ClabSourceEndpoint string
				ClabTargetEndpoint string
			}{l.ClabSourceEndpoint, l.ClabTargetEndpoint},
		}

		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}
	// log.Info(cyTopo.Nodes)

	// jsonBytesCytoUi, err := json.MarshalIndent(CytoTopology{
	// 	Nodes: cyTopo.Nodes,
	// 	Links: cyTopo.Links}, "", "  ")
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }

	// _, err = os.Stdout.Write(jsonBytesCytoUi)
	// if err != nil {
	// 	log.Error(err)
	// 	panic(err)
	// }
	// log.Info("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	// jsonBytesCytoUi, err := json.MarshalIndent(CytoJsonTopology{
	// 	Element: cytoJsonArray}, "", "  ")

	jsonBytesCytoUi, err := json.MarshalIndent(cytoJsonArray, "", "  ")
	if err != nil {
		log.Error(err)
		panic(err)
	}

	_, err = os.Stdout.Write(jsonBytesCytoUi)
	if err != nil {
		log.Error(err)
		panic(err)
	}
	log.Info("jsonBytesCytoUi Result:", string(jsonBytesCytoUi))

	return jsonBytesCytoUi
}

func (cyTopo *CytoTopology) PrintjsonBytesCytoUi(marshaledJsonBytesCytoUi []byte) error {
	// Create file
	os.Mkdir("./html-public/"+cyTopo.ClabTopoData.ClabTopoName, 0755)
	file, err := os.Create("html-public/" + cyTopo.ClabTopoData.ClabTopoName + "/dataCytoMarshall-" + cyTopo.ClabTopoData.ClabTopoName + ".json")
	if err != nil {
		log.Error("Could not create json file for graph")
	}

	// Write to file
	_, err = file.Write(marshaledJsonBytesCytoUi)
	if err != nil {
		log.Error("Could not write json to file")
	}
	return err
}
