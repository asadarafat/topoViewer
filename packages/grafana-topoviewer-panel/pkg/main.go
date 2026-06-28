package main

import (
	"os"

	"github.com/asadarafat/topoviewer/packages/grafana-topoviewer-panel/pkg/plugin"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
	if err := backend.Serve(backend.ServeOpts{
		CallResourceHandler: plugin.NewBundleResourceHandler(),
	}); err != nil {
		log.DefaultLogger.Error("failed to start TopoViewer Grafana backend", "error", err)
		os.Exit(1)
	}
}
