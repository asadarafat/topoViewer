package topoengine

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	netmigo "github.com/asadarafat/netmiGO/netmigo"

	log "github.com/sirupsen/logrus"
)

// DeviceOperation performs the defined operations on the device
func (cyTopo *CytoTopology) NodeConfigBackupRestore(deviceKind, ipAddress, username, password, configName, directory, action string) error {
	if deviceKind == "vr-sros" || deviceKind == "nokia_sros" {
		if action == "backup" {
			var output string
			configFileName := fmt.Sprintf("%s-%s.cfg", configName, time.Now().Format("2006-01-02T15-04-05Z")) // Get the current time

			log.Infof("NodeConfigBackup() - deviceType: %s", deviceKind)

			srosDevice, err := netmigo.InitSROSDevice(ipAddress, username, password, 22)
			if err != nil {
				log.Error(err)
			}
			if err := srosDevice.Connect(); err != nil {
				log.Error(err)
			}

			output, _ = srosDevice.SendCommand("environment more false")
			log.Infof("NokiaSrosBackup() - output of environment more false: %s", output)

			output, _ = srosDevice.SendCommand("admin show configuration configure")
			log.Infof("NokiaSrosBackup() - admin show configuration configure: %s", output)

			backupPath := filepath.Join(directory, configFileName)

			err = os.WriteFile(backupPath, []byte(output), 0644)
			if err != nil {
				log.Errorf("Failed to save configuration: %v", err)
				return err
			}
			log.Infof("Configuration saved to %s", backupPath)

			output, _ = srosDevice.SendCommand("environment more true")
			log.Infof("NokiaSrosBackup() - output of environment more true: %s", output)

			srosDevice.Disconnect()

		} else if action == "running" {
			var output string
			configFileName := fmt.Sprintf("%s-running.cfg", configName) // Get the current time

			log.Infof("NodeConfigBackup() - deviceType: %s", deviceKind)

			srosDevice, err := netmigo.InitSROSDevice(ipAddress, username, password, 22)
			if err != nil {
				log.Error(err)
			}
			if err := srosDevice.Connect(); err != nil {
				log.Error(err)
			}

			output, _ = srosDevice.SendCommand("environment more false")
			log.Infof("NokiaSrosBackup() - output of environment more false: %s", output)

			output, _ = srosDevice.SendCommand("admin show configuration configure")
			log.Infof("NokiaSrosBackup() - admin show configuration configure: %s", output)

			backupPath := filepath.Join(directory, configFileName)

			err = os.WriteFile(backupPath, []byte(output), 0644)
			if err != nil {
				log.Errorf("Failed to save configuration: %v", err)
				return err
			}
			log.Infof("Configuration saved to %s", backupPath)

			output, _ = srosDevice.SendCommand("environment more true")
			log.Infof("NokiaSrosBackup() - output of environment more true: %s", output)

			srosDevice.Disconnect()

		} else if action == "restore" {
			log.Infof("NokiaSrosRestore() - deviceType: %s", deviceKind)

			localPath := filepath.Join(directory, configName)
			remotePath := filepath.Join("cf3:", configName)

			log.Infof("NokiaSrosRestore() - localPath: %s", localPath)
			log.Infof("NokiaSrosRestore() - remotePath: %s", remotePath)

			srosDevice, err := netmigo.InitSROSDevice(ipAddress, username, password, 22)
			if err != nil {
				log.Error(err)
			}
			if err := srosDevice.Connect(); err != nil {
				log.Error(err)
			}
			if err := srosDevice.FileTransfer(localPath, remotePath); err != nil {
				log.Error(err)
			}

			// Send a set of config commands
			commands := []string{fmt.Sprintf("load full-replace %s", remotePath)}
			output, _ := srosDevice.SendConfigSet(commands)

			log.Infof("NokiaSrosRestore() - output of : %s", output)

			srosDevice.Disconnect()

		}
	} else {
		log.Errorf("Unsupported device type: %s", deviceKind)
		return fmt.Errorf("unsupported device type: %s", deviceKind)
	}

	return nil
}

// func (cyTopo *CytoTopology) NodeConfigRestore(deviceKind, ipAddress, username, password, configName, directory, action string) error {
// 	log.Info("NodeConfigRestore() - RESTORE")

// 	if deviceKind == "vr-sros" {
// 		log.Infof("NokiaSrosRestore() - deviceType: %s", deviceKind)

// 		localPath := filepath.Join(directory, configName)
// 		remotePath := filepath.Join("cf3:", configName)

// 		log.Infof("NokiaSrosRestore() - localPath: %s", localPath)
// 		log.Infof("NokiaSrosRestore() - remotePath: %s", remotePath)

// 		srosDevice, err := netmigo.InitSROSDevice(ipAddress, username, password, 22)
// 		if err != nil {
// 			log.Error(err)
// 		}
// 		if err := srosDevice.Connect(); err != nil {
// 			log.Error(err)
// 		}
// 		if err := srosDevice.FileTransfer(localPath, remotePath); err != nil {
// 			log.Error(err)
// 		}

// 		// Send a set of config commands
// 		commands := []string{fmt.Sprintf("load full-replace %s", remotePath)}
// 		output, _ := srosDevice.SendConfigSet(commands)

// 		log.Infof("NokiaSrosRestore() - output of : %s", output)

// 		srosDevice.Disconnect()

// 	} else {
// 		log.Errorf("Unsupported device type: %s", deviceKind)
// 		return fmt.Errorf("unsupported device type: %s", deviceKind)
// 	}

// 	return nil
// }
