package main

import (
	"github.com/asadarafat/topoViewer/cloudshellwrapper"
)

// // var conf = cloudshellwrapper.Conf
var VersionInfo string

func main() {

	if VersionInfo == "" {
		VersionInfo = "dev"
	}

	cloudshellwrapper.Execute()

}

// import (
// 	"fmt"
// 	"path"
// 	"strings"

// 	"github.com/asadarafat/topoViewer/tools"
// 	"github.com/spf13/viper"
// )

// func main() {
// 	workingDirectory := "."
// 	filePath := path.Join(workingDirectory, "./cloudshellwrapper/cmd")
// 	readYaml(filePath)
// }

// func readYaml(filePath string) {
// 	viper.SetConfigName("items.yaml") // name of config file (without extension)
// 	viper.SetConfigType("yaml")       // REQUIRED if the config file does not have the extension in the name
// 	viper.AddConfigPath(filePath)     // path to look for the config file in

// 	err := viper.ReadInConfig() // Find and read the config file
// 	if err != nil {             // Handle errors reading the config file
// 		panic(fmt.Errorf("fatal error config file: %w", err))
// 	}
// 	// fmt.Println(viper.AllKeys())
// 	var nodesNames []string
// 	for _, i := range viper.AllKeys() {
// 		// fmt.Println(i, viper.Get(i))
// 		if strings.Contains(i, "topology.nodes") {
// 			// fmt.Println(i, viper.Get(i))
// 			nodeName := strings.Split(i, ".")
// 			// fmt.Println(nodeName[2])
// 			nodesNames = append(nodesNames, nodeName[2])
// 		}
// 	}
// 	nodesNames = tools.RemoveDuplicateNodesValues(nodesNames)
// 	fmt.Println(nodesNames)

// 	for _, i := range viper.AllKeys() {
// 		for _, j := range nodesNames {
// 			if strings.Contains(i, j+".mgmt_ipv4") || strings.Contains(i, j+".kind") || strings.Contains(i, j+".image") || strings.Contains(i, j+".license") || strings.Contains(i, j+".binds") || strings.Contains(i, j+".exec") || strings.Contains(i, j+".ports") || strings.Contains(i, j+".entrypoint") {
// 				// fmt.Println(i, viper.Get(i))
// 				switch attribute := strings.Contains(i, j+".mgmt_ipv4") || strings.Contains(i, j+".kind") || strings.Contains(i, j+".image") || strings.Contains(i, j+".license") || strings.Contains(i, j+".binds") || strings.Contains(i, j+".exec") || strings.Contains(i, j+".ports") || strings.Contains(i, j+".entrypoint"); attribute {
// 				case strings.Contains(i, j+".mgmt_ipv4"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".kind"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".image"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".license"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".binds"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".exec"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".ports"):
// 					fmt.Println(i, viper.Get(i))
// 				case strings.Contains(i, j+".entrypoint"):
// 					fmt.Println(i, viper.Get(i))
// 				}
// 			}
// 		}
// 	}
// }
