package main

import (
	"github.com/asadarafat/topoViewer/cloudshellwrapper"

	"github.com/spf13/cobra"
)

var VersionInfo string
var conf = cloudshellwrapper.Conf

func main() {

	if VersionInfo == "" {
		VersionInfo = "dev"
	}
	rootCommand := cobra.Command{
		Use:     "topoviewer",
		Short:   "Creates a web-based shell using xterm.js that links to an actual shell",
		Version: VersionInfo,
		RunE:    cloudshellwrapper.RunEClab,
	}
	conf.ApplyToCobra(&rootCommand)
	rootCommand.Execute()
}
