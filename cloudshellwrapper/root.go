package cloudshellwrapper

import (
	"os"

	log "github.com/asadarafat/topoViewer/tools"

	"github.com/spf13/cobra"
)

var rootCommand = cobra.Command{
	Use:     "topoviewer",
	Short:   "Creates a web-based topology view",
	Version: VersionInfo,
}

func Execute() {
	if err := rootCommand.Execute(); err != nil {
		log.Info(err)
		os.Exit(1)
	}
}
