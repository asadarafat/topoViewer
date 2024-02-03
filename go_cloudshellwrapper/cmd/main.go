package main

import (
	cloudshellwrapper "github.com/asadarafat/topoViewer/go_cloudshellwrapper"
)

// // var conf = cloudshellwrapper.Conf
var VersionInfo string

func main() {

	if VersionInfo == "" {
		VersionInfo = "dev"
	}

	cloudshellwrapper.Execute()

}
