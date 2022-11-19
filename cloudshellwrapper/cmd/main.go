package main

import (
	"github.com/asadarafat/topoViewer/cloudshellwrapper"
)

// var conf = cloudshellwrapper.Conf
var VersionInfo string

func main() {

	if VersionInfo == "" {
		VersionInfo = "dev"
	}

	cloudshellwrapper.Execute()

}
