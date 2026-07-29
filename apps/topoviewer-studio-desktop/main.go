package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app, err := NewDesktopApp()
	if err != nil {
		log.Fatal(err)
	}
	err = wails.Run(&options.App{
		AssetServer: &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{
			R: 18,
			G: 18,
			B: 18,
			A: 1,
		},
		Bind:       []interface{}{app},
		Height:     900,
		MinHeight:  700,
		MinWidth:   1024,
		OnShutdown: app.shutdown,
		OnStartup:  app.startup,
		Title:      "TopoViewer Studio",
		Width:      1440,
	})
	if err != nil {
		log.Fatal(err)
	}
}
