package topoengine

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/scrapli/scrapligo/driver/options"
	"github.com/scrapli/scrapligo/platform"

	tools "github.com/asadarafat/topoViewer/go_tools"
	log "github.com/sirupsen/logrus"
)

// DeviceOperation performs the defined operations on the device
func (cyTopo *CytoTopology) NodeConfigBackup(deviceKind, ipAddress, username, password, configName, directory, action string) error {
	var commands []string
	var deviceType string
	var configFileName string

	if deviceKind == "vr-sros" {
		deviceType = "nokia_sros"
		if action == "backup" {

			log.Info("Backing up node cofing with the following detail: ")
			log.Infof("deviceKind: %s", deviceKind)
			log.Infof("ipAddress: %s", ipAddress)
			log.Infof("username: %s", username)
			log.Infof("password: %s", password)

			configFileName = fmt.Sprintf("%s-%s.cfg", configName, time.Now().UTC().Format(time.RFC3339)) // Get the current time sung Format the timestamp using RFC3339

			log.Infof("configPrefixName: %s", configFileName)
			log.Infof("configBackupDirectory: %s", directory)
			log.Infof("NodeBackupFunctionFlag: %s", action)

			commands = []string{
				"show version",
				"environment more false",
				"admin show configuration configure",
				"environment more true",
			}
			platformInstance, err := platform.NewPlatform(
				deviceType,
				ipAddress,
				options.WithAuthNoStrictKey(),
				options.WithAuthUsername(username),
				options.WithAuthPassword(password),
			)

			if err != nil {
				log.Errorf("Failed to create scrapligo platform; error: %+v", err)
				return err
			}

			device, err := platformInstance.GetNetworkDriver()
			if err != nil {
				log.Errorf("Failed to fetch network driver from the platform; error: %+v", err)
				return err
			}

			connected := false
			defer func() {
				if connected {
					device.Close()
				}
			}()

			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()

			errChan := make(chan error, 1)

			go func() {
				errChan <- device.Open()
			}()

			select {
			case <-ctx.Done():
				log.Errorf("Connection attempt timed out")
				return ctx.Err()
			case err := <-errChan:
				if err != nil {
					log.Errorf("Failed to open connection: %v", err)
					return err
				}
			}

			connected = true

			for _, command := range commands {
				output, err := device.SendCommand(command)
				if err != nil {
					log.Errorf("Failed to execute command '%s': %v", command, err)
					return err
				}
				log.Infof("Command output for '%s': %s", command, output.RawResult)

				if command == "admin show configuration configure" {

					backupPath := filepath.Join(directory, configFileName)
					err := os.WriteFile(backupPath, []byte(output.RawResult), 0644)
					if err != nil {
						log.Errorf("Failed to save configuration: %v", err)
						return err
					}
					log.Infof("Configuration saved to %s", backupPath)
				}
			}
		} else if action == "running" {

			log.Info("Backing up node cofing with the following detail: ")
			log.Infof("deviceKind: %s", deviceKind)
			log.Infof("ipAddress: %s", ipAddress)
			log.Infof("username: %s", username)
			log.Infof("password: %s", password)

			configFileName := fmt.Sprintf("%s-%s.cfg", configName, "running") // append running string

			log.Infof("configPrefixName: %s", configFileName)
			log.Infof("configBackupDirectory: %s", directory)
			log.Infof("NodeBackupFunctionFlag: %s", action)

			commands = []string{
				"show version",
				"environment more false",
				"admin show configuration configure",
				"environment more true",
			}
		}
		platformInstance, err := platform.NewPlatform(
			deviceType,
			ipAddress,
			options.WithAuthNoStrictKey(),
			options.WithAuthUsername(username),
			options.WithAuthPassword(password),
		)

		if err != nil {
			log.Errorf("Failed to create scrapligo platform; error: %+v", err)
			return err
		}

		device, err := platformInstance.GetNetworkDriver()
		if err != nil {
			log.Errorf("Failed to fetch network driver from the platform; error: %+v", err)
			return err
		}

		connected := false
		defer func() {
			if connected {
				device.Close()
			}
		}()

		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		errChan := make(chan error, 1)

		go func() {
			errChan <- device.Open()
		}()

		select {
		case <-ctx.Done():
			log.Errorf("Connection attempt timed out")
			return ctx.Err()
		case err := <-errChan:
			if err != nil {
				log.Errorf("Failed to open connection: %v", err)
				return err
			}
		}

		connected = true

		for _, command := range commands {
			output, err := device.SendCommand(command)
			if err != nil {
				log.Errorf("Failed to execute command '%s': %v", command, err)
				return err
			}
			log.Infof("Command output for '%s': %s", command, output.RawResult)

			if command == "admin show configuration configure" {

				backupPath := filepath.Join(directory, configFileName)
				err := os.WriteFile(backupPath, []byte(output.RawResult), 0644)
				if err != nil {
					log.Errorf("Failed to save configuration: %v", err)
					return err
				}
				log.Infof("Configuration saved to %s", backupPath)
			}
		}

	} else {
		log.Errorf("Unsupported device type: %s", deviceType)
		return fmt.Errorf("unsupported device type: %s", deviceType)
	}

	return nil
}

func (cyTopo *CytoTopology) NodeConfigRestore(deviceKind, ipAddress, username, password, configName, directory, action string) error {
	var commands []string
	var deviceType string

	if deviceKind == "vr-sros" {
		deviceType := "nokia_sros"

		log.Infof("NokiaSrosRestore() - deviceType: %s", deviceType)

		localPath := filepath.Join(directory, configName)
		remotePath := filepath.Join("cf3:", configName)

		err := tools.SCPFile(ipAddress, username, password, localPath, remotePath, true, tools.SCPPut)
		if err != nil {
			log.Infof("Error transferring file: %v\n", err)
		} else {
			log.Infof("File transferred successfully: %s -> %s\n", localPath, remotePath)
		}

		commands = []string{
			"show version",
			"exit",
			"configure private",
			"load full-replace cf3:clab-nokia-ServiceProvider-R09-PE-ASBR-running.cfg",
			"commit",
			"admin save",
			"exit",
		}

		log.Infof("sending the folllowing comamands sequence to the node: %s", commands)
		platformInstance, err := platform.NewPlatform(
			deviceType,
			ipAddress,
			options.WithAuthNoStrictKey(),
			options.WithAuthUsername(username),
			options.WithAuthPassword(password),
		)
		if err != nil {
			log.Errorf("Failed to create scrapligo platform; error: %+v", err)
			return err
		}

		device, err := platformInstance.GetNetworkDriver()
		if err != nil {
			log.Errorf("Failed to fetch network driver from the platform; error: %+v", err)
			return err
		}

		connected := false
		defer func() {
			if connected {
				device.Close()
			}
		}()

		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		errChan := make(chan error, 1)

		go func() {
			errChan <- device.Open()
		}()

		select {
		case <-ctx.Done():
			log.Errorf("Connection attempt timed out")
			return ctx.Err()
		case err := <-errChan:
			if err != nil {
				log.Errorf("Failed to open connection: %v", err)
				return err
			}
		}

		connected = true

		for _, command := range commands {
			output, err := device.SendCommand(command)
			if err != nil {
				log.Errorf("Failed to execute command '%s': %v", command, err)
				return err
			}
			log.Infof("Command output for '%s': %s", command, output.RawResult)

		}

	} else {
		log.Errorf("Unsupported device type: %s", deviceType)
		return fmt.Errorf("unsupported device type: %s", deviceType)
	}

	return nil
}
