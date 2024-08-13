// clabGetEnvironment.go
package clabhandlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	log "github.com/sirupsen/logrus"

	"github.com/docker/docker/client"
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/mem"
)

type ContainerUsage struct {
	ID     string  `json:"ID"`
	Name   string  `json:"Name"`
	CPU    float64 `json:"CPU"`
	Memory float64 `json:"Memory"`
}

type UsageData struct {
	CPU        float64          `json:"CPU"`
	Memory     float64          `json:"Memory"`
	Containers []ContainerUsage `json:"Containers"`
}

func ContainerComputeResourceUsage(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cpuPercent, err := cpu.Percent(0, false)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	memInfo, err := mem.VirtualMemory()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	containers, err := cli.ContainerList(ctx, container.ListOptions{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	containerUsages := make([]ContainerUsage, 0)
	for _, container := range containers {
		stats, err := cli.ContainerStatsOneShot(ctx, container.ID)
		if err != nil {
			log.Infof("Error retrieving stats for container id %s: %v", container.ID, err)
			log.Infof("Error retrieving stats for container image %s: %v", container.Image, err)

			continue // Skip this container or handle error differently
		}
		defer stats.Body.Close()

		var statsData types.StatsJSON
		err = json.NewDecoder(stats.Body).Decode(&statsData)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		cpuDelta := float64(statsData.CPUStats.CPUUsage.TotalUsage - statsData.PreCPUStats.CPUUsage.TotalUsage)
		systemDelta := float64(statsData.CPUStats.SystemUsage - statsData.PreCPUStats.SystemUsage)
		numberCPUs := float64(statsData.CPUStats.OnlineCPUs)
		cpuPercent := (cpuDelta / systemDelta) * numberCPUs * 100.0

		memoryUsage := float64(statsData.MemoryStats.Usage) / float64(statsData.MemoryStats.Limit) * 100.0

		containerUsages = append(containerUsages, ContainerUsage{
			ID:     container.ID,
			Name:   container.Names[0],
			CPU:    cpuPercent,
			Memory: memoryUsage,
		})
	}

	usageData := UsageData{
		CPU:        cpuPercent[0],
		Memory:     memInfo.UsedPercent,
		Containers: containerUsages,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usageData)
}
