package topoengine

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/user"
	"path"
	"strconv"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"

	tools "github.com/asadarafat/topoViewer/tools"

	"github.com/srl-labs/containerlab/clab"
)

func (cyTopo *CytoTopology) InitLogger() {
	// init logConfig
	toolLogger := tools.Logs{}
	toolLogger.InitLogger("logs/topoengine-CytoTopology.log", cyTopo.LogLevel)
}

func (cyTopo *CytoTopology) MarshalContainerLabTopo(topoFile string) error {
	log.Info(topoFile)
	// static definition of topofile path
	// filePath, _ := os.Getwd()
	// filePath = (filePath + "/rawTopoFile/")
	// log.Info(filePath + topoFile)

	c, err := clab.NewContainerLab(
		clab.WithTimeout(time.Second*30),
		clab.WithTopoFile(topoFile, ""),
	)
	log.Info(topoFile)

	if err != nil {
		return err
	}
	cyTopo.ClabTopoData.ClabNodes = c.Nodes
	cyTopo.ClabTopoData.NodeDefinition = c.Config.Topology.Nodes
	cyTopo.ClabTopoData.ClabLinks = c.Links
	cyTopo.ClabTopoData.ClabTopoName = c.Config.Name

	return nil
}

func (cyTopo *CytoTopology) MarshalContainerLabTopov2(topoFile string) error {

	clabNodeData := ClabNode{}

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
			clabNodeData.Data = map[string]interface{}{
				"Name":     nodeName,
				"Image":    viper.Get("topology.nodes." + nodeName + ".image"),
				"ClabKind": viper.Get("topology.nodes." + nodeName + ".kind"),
				"Binds":    viper.Get("topology.nodes." + nodeName + ".binds"),
			}
		}
		NodesList = append(NodesList, clabNodeData)
	}
	cyTopo.ClabTopoData.NodesList = NodesList
	log.Infof("cyTopo.ClabTopoData.NodesList    : '%s'", cyTopo.ClabTopoData.NodesList)

	endpoint := Endpoint{}
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

				endpoint.Source = strings.Split(strings.Split(endpointRaw, " ")[0], ":")[0]
				endpoint.SourceEndpoint = strings.Split(strings.Split(endpointRaw, " ")[0], ":")[1]
				endpoint.Target = strings.Split(strings.Split(endpointRaw, " ")[1], ":")[0]
				endpoint.TargetEndpoint = strings.Split(strings.Split(endpointRaw, " ")[1], ":")[1]

				log.Infof("####endpoint.Source   : '%s'", endpoint.Source)
				log.Infof("####endpoint.SourceEndpoint   : '%s'", endpoint.SourceEndpoint)
				log.Infof("####endpoint.Target   : '%s'", endpoint.Target)
				log.Infof("####endpoint.TargetEndpoint   : '%s'", endpoint.TargetEndpoint)

				LinksList.Endpoints = append(LinksList.Endpoints, endpoint)
			}
		}
	}
	cyTopo.ClabTopoData.LinksList = LinksList
	log.Infof("cyTopo.ClabTopoData.LinksList    : '%s'", cyTopo.ClabTopoData.LinksList)

	cyTopo.ClabTopoData.ClabTopoName = viper.Get("name").(string)
	log.Infof("cyTopo.ClabTopoData.ClabTopoName    : '%s'", cyTopo.ClabTopoData.ClabTopoName)

	return nil
}

func (cyTopo *CytoTopology) UnmarshalContainerLabTopov2(ClabTopoStruct) []byte {

	cytoJson := CytoJson{}
	cytoJsonArray := []CytoJson{}

	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}
	Username := user.Username

	for _, n := range cyTopo.ClabTopoData.NodesList {

		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = n.Data["Name"].(string)
		cytoJson.Data.Name = n.Data["Name"].(string) // get the Node name by accessing direct via Interface
		cytoJson.Data.Kind = n.Data["ClabKind"].(string)
		cytoJson.Data.Weight = "2"
		cytoJson.Data.ExtraData = n.Data // copy all attribute of clab n.Data to cyto ExtraData
		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}

	for i, l := range cyTopo.ClabTopoData.LinksList.Endpoints {

		cytoJson.Group = "edges"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = strconv.Itoa(i)
		cytoJson.Data.Weight = "1"
		cytoJson.Data.Name = l.Source + "::" + l.SourceEndpoint + " <--> " + l.Target + "::" + l.TargetEndpoint
		cytoJson.Data.Source = l.Source
		cytoJson.Data.Endpoint.SourceEndpoint = l.SourceEndpoint
		cytoJson.Data.Target = l.Target
		cytoJson.Data.Endpoint.TargetEndpoint = l.TargetEndpoint

		cytoJson.Data.ExtraData = map[string]interface{}{
			"ClabServerUsername": Username,
			"Kind":               "ClabLink",
			"grabbable":          true,
			"selectable":         true,
			"ID":                 strconv.Itoa(i),
			"weight":             "1",
			"Name":               l.Source + "::" + l.SourceEndpoint + " <--> " + l.Target + "::" + l.TargetEndpoint,
			"SourceLongName":     l.Source,
			"TargetLongName":     l.Target,
			"Endpoints": struct {
				SourceEndpoint string
				TargetEndpoint string
			}{l.SourceEndpoint, l.TargetEndpoint},
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

func (cyTopo *CytoTopology) UnmarshalContainerLabTopo(ClabTopoStruct) []byte {

	cytoJson := CytoJson{}
	cytoJsonArray := []CytoJson{}

	// get Clab ServerHost Username
	user, err := user.Current()
	if err != nil {
		log.Error(err.Error())
	}
	Username := user.Username

	// 	ExtraData: make(map[string]interface{}, 0),
	// }
	// link := CytoLink{
	// 	ExtraData: make(map[string]interface{}, 0),
	// }

	for i, n := range cyTopo.ClabTopoData.ClabNodes {

		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = string(i)
		cytoJson.Data.Weight = "2"

		cytoJson.Data.Name = n.Config().ShortName

		log.Info(n.Config().ShortName)

		cytoJson.Data.ExtraData = map[string]interface{}{
			// "eggs": struct {
			// 	source string
			// 	price  float64
			// }{"chicken", 1.75},
			"ClabServerUsername": Username,
			"ClabNodeName":       n.Config().ShortName,
			"ClabNodeLongName":   n.Config().LongName,
			"ID":                 string(i),
			"Weight":             "2",
			"Name":               n.Config().ShortName,
			"ClabKind":           n.Config().Kind,
			"Image":              n.Config().Image,
			"ClabGroup":          n.Config().Group,
			"MgmtIPv4Address":    n.Config().MgmtIPv4Address,
			"MgmtIPv6Address":    n.Config().MgmtIPv6Address,
			"Binds":              n.Config().Binds,
			"Exec":               n.Config().Exec,
			"Publish":            n.Config().Publish,
			"PortSet":            n.Config().PortSet,
			"Entrypoint":         n.Config().Entrypoint,
			"DockerUser":         n.Config().User,
		}
		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}

	for i, n := range cyTopo.ClabTopoData.NodeDefinition {

		cytoJson.Group = "nodes"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = string(i)
		cytoJson.Data.Weight = "2"

		cytoJson.Data.Name = n.Type

		// log.Info(n.Config().ShortName)

		cytoJson.Data.ExtraData = map[string]interface{}{
			// "eggs": struct {
			// 	source string
			// 	price  float64
			// }{"chicken", 1.75},
			"ClabServerUsername": Username,
			"ClabNodeName":       n.Type,
			// "ClabNodeLongName":   n.Config().LongName,
			"ID":              string(i),
			"Weight":          "2",
			"Name":            n.Type,
			"ClabKind":        n.Kind,
			"Image":           n.Image,
			"ClabGroup":       n.Group,
			"MgmtIPv4Address": n.MgmtIPv4,
			"MgmtIPv6Address": n.MgmtIPv6,
			"Binds":           n.Binds,
			"Exec":            n.Exec,
			"Publish":         n.Publish,
			"Port":            n.Ports,
			"Entrypoint":      n.Entrypoint,
			"DockerUser":      n.User,
		}
		cytoJsonArray = append(cytoJsonArray, cytoJson)
	}

	for i, l := range cyTopo.ClabTopoData.ClabLinks {

		cytoJson.Group = "edges"
		cytoJson.Grabbable = true
		cytoJson.Selectable = true
		cytoJson.Data.ID = strconv.Itoa(i)
		cytoJson.Data.Weight = "1"
		cytoJson.Data.Name = l.A.Node.ShortName + "::" + l.A.EndpointName + " <--> " + l.B.Node.ShortName + "::" + l.B.EndpointName
		cytoJson.Data.Source = l.A.Node.ShortName
		cytoJson.Data.Endpoint.SourceEndpoint = l.A.EndpointName
		cytoJson.Data.Target = l.B.Node.ShortName
		cytoJson.Data.Endpoint.TargetEndpoint = l.B.EndpointName

		cytoJson.Data.ExtraData = map[string]interface{}{
			"ClabServerUsername": Username,
			"Kind":               "ClabLink",
			"grabbable":          true,
			"selectable":         true,
			"ID":                 strconv.Itoa(i),
			"weight":             "1",
			"Name":               l.A.Node.ShortName + "::" + l.A.EndpointName + "<-->" + l.B.Node.ShortName + "::" + l.B.EndpointName,
			"SourceLongName":     l.A.Node.LongName,
			"TargetLongName":     l.B.Node.LongName,
			"Endpoints": struct {
				SourceEndpoint string
				TargetEndpoint string
			}{l.A.EndpointName, l.B.EndpointName},
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
