package topoengine

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
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

			output, _ = srosDevice.SendCommand("admin show configuration")
			log.Infof("NokiaSrosBackup() - admin show configuration: %s", output)

			// Split the output string into lines
			lines := strings.Split(output, "\n")

			// Remove the first and last two lines
			trimmedLines := lines[1 : len(lines)-2]

			// Join the remaining lines into a single string
			processedOutput := strings.Join(trimmedLines, "\n")

			log.Infof("NokiaSrosBackup() - admin show configuration: %s", processedOutput)

			backupPath := filepath.Join(directory, configFileName)

			err = os.WriteFile(backupPath, []byte(processedOutput), 0644)
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
			configFileName := fmt.Sprintf("%s-running.cfg", configName)

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

			output, _ = srosDevice.SendCommand("admin show configuration")

			// Split the output string into lines
			lines := strings.Split(output, "\n")

			// Remove the first and last two lines
			trimmedLines := lines[1 : len(lines)-2]

			// Join the remaining lines into a single string
			processedOutput := strings.Join(trimmedLines, "\n")

			log.Infof("NokiaSrosBackup() - admin show configuration: %s", processedOutput)

			backupPath := filepath.Join(directory, configFileName)

			err = os.WriteFile(backupPath, []byte(processedOutput), 0644)
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
	} else if deviceKind == "srl" || deviceKind == "nokia_srl" {
		if action == "backup" {
			var output string
			configFileName := fmt.Sprintf("%s-%s.cfg", configName, time.Now().Format("2006-01-02T15-04-05Z")) // Get the current time

			srlDevice, err := netmigo.InitSRLDevice(ipAddress, username, "NokiaSrl1!", 22)
			if err != nil {
				log.Error(err)
			}

			err = srlDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// execute running config save
			saveRunningCommand := fmt.Sprintf("save file %s from running", configFileName)
			output, err = srlDevice.SendCommand(saveRunningCommand, "running", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("NokiaSrlBackup() - output of `save file running-config.json from running`: %s", output)

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)       // path in TopoViewer server
			remotePath := filepath.Join("/home/admin/", configFileName) // path in srl device

			log.Infof("NokiaSrlBackup() - localPath`: %s", localPath)
			log.Infof("NokiaSrlBackup() - remotePath`: %s", remotePath)

			err = srlDevice.RetrieveFile(remotePath, localPath)
			if err != nil {
				log.Error(err)
			}

			srlDevice.Disconnect()

			log.Infof("NodeConfigBackup() - deviceType: %s", deviceKind)

		} else if action == "running" {
			var output string
			configFileName := fmt.Sprintf("%s-running.cfg", configName)

			log.Infof("NodeConfigBackup() - deviceType: %s", deviceKind)

			srlDevice, err := netmigo.InitSRLDevice(ipAddress, username, "NokiaSrl1!", 22)
			if err != nil {
				log.Error(err)
			}

			err = srlDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// execute running config save
			saveRunningCommand := fmt.Sprintf("save file %s from running", configFileName)

			output, err = srlDevice.SendCommand(saveRunningCommand, "running", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("NokiaSrlBackup() - output of save file %s from running`: %s", configFileName, output)

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)       // path in TopoViewer server
			remotePath := filepath.Join("/home/admin/", configFileName) // path in srl device

			log.Infof("NokiaSrlRunning() - localPath`: %s", localPath)
			log.Infof("NokiaSrlRunning() - remotePath`: %s", remotePath)

			err = srlDevice.RetrieveFile(remotePath, localPath)
			if err != nil {
				log.Error(err)
			}

			srlDevice.Disconnect()

		} else if action == "restore" {
			var output string
			configFileName := configName

			log.Infof("NokiaSrosRestore() - deviceType: %s", deviceKind)

			srlDevice, err := netmigo.InitSRLDevice(ipAddress, username, "NokiaSrl1!", 22)
			if err != nil {
				log.Error(err)
			}
			err = srlDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)       // path in TopoViewer server
			remotePath := filepath.Join("/home/admin/", configFileName) // path in srl device

			log.Infof("NokiaSrlRunning() - localPath`: %s", localPath)
			log.Infof("NokiaSrlRunning() - remotePath`: %s", remotePath)

			err = srlDevice.FileTransfer(localPath, remotePath)
			if err != nil {
				log.Error(err)
			}

			// Send a set of config command
			loadConfigCommand := fmt.Sprintf("load file %s auto-commit", configFileName)
			output, err = srlDevice.SendCommand(loadConfigCommand, "candidate", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("NokiaSrosRestore() - output of  %s : %s", loadConfigCommand, output)
			srlDevice.Disconnect()
		}

		// vr-juniper_vmx
		// vr-juniper_vmx
	} else if deviceKind == "vr-vmx" || deviceKind == "vr-juniper_vmx" {
		if action == "backup" {
			var output string
			configFileName := fmt.Sprintf("%s-%s.cfg", configName, time.Now().Format("2006-01-02T15-04-05Z")) // Get the current time
			// configFileName := fmt.Sprintf("%s.cfg", configName) // Get the current time

			junosDevice, err := netmigo.InitJUNOSDevice(ipAddress, username, "admin@123", 22)
			if err != nil {
				log.Error(err)
			}

			err = junosDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// execute running config save
			saveRunningCommand := fmt.Sprintf("show configuration | save /var/home/admin/%s", configFileName)
			output, err = junosDevice.SendCommand(saveRunningCommand, "running", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("JuniperJunosBackup() - output of `save file running-config.json from running`: %s", output)

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)           // path in TopoViewer server
			remotePath := filepath.Join("/var/home/admin/", configFileName) // path in junos device

			log.Infof("JuniperJunosBackup() - localPath`: %s", localPath)
			log.Infof("JuniperJunosBackup() - remotePath`: %s", remotePath)

			err = junosDevice.RetrieveFile(remotePath, localPath)
			if err != nil {
				log.Error(err)
			}

			junosDevice.Disconnect()

			log.Infof("JuniperJunosBackup() - deviceType: %s", deviceKind)

		} else if action == "running" {
			var output string
			configFileName := fmt.Sprintf("%s-running.cfg", configName)

			log.Infof("JuniperJunosBackup() - deviceType: %s", deviceKind)

			junosDevice, err := netmigo.InitJUNOSDevice(ipAddress, username, "admin@123", 22)
			if err != nil {
				log.Error(err)
			}

			err = junosDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// execute running config save
			saveRunningCommand := fmt.Sprintf("show configuration | save /var/home/admin/%s", configFileName)

			output, err = junosDevice.SendCommand(saveRunningCommand, "running", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("JuniperJunosBackup() - output of save file %s from running`: %s", configFileName, output)

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)           // path in TopoViewer server
			remotePath := filepath.Join("/var/home/admin/", configFileName) // path in srl device

			log.Infof("JuniperJunosRunning() - localPath`: %s", localPath)
			log.Infof("JuniperJunosRunning() - remotePath`: %s", remotePath)

			err = junosDevice.RetrieveFile(remotePath, localPath)
			if err != nil {
				log.Error(err)
			}

			junosDevice.Disconnect()

		} else if action == "restore" {
			var output string
			configFileName := configName

			log.Infof("JuniperJunosRestore() - deviceType: %s", deviceKind)

			junosDevice, err := netmigo.InitJUNOSDevice(ipAddress, username, "admin@123", 22)
			if err != nil {
				log.Error(err)
			}
			err = junosDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)           // path in TopoViewer server
			remotePath := filepath.Join("/var/home/admin/", configFileName) // path in srl device

			log.Infof("JuniperJunosRestore() - localPath`: %s", localPath)
			log.Infof("JuniperJunosRestore() - remotePath`: %s", remotePath)

			err = junosDevice.FileTransfer(localPath, remotePath)
			if err != nil {
				log.Error(err)
			}

			// Send a set of config command
			loadConfigCommand := fmt.Sprintf("load replace %s", configFileName)
			output, err = junosDevice.SendCommand(loadConfigCommand, "candidate", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("JuniperJunosRestore() - output of  %s : %s", loadConfigCommand, output)
			junosDevice.Disconnect()

			// vr-cisco_xrv9k
			// vr-cisco_xrv9k

		}

	} else if deviceKind == "vr-xrv9k" || deviceKind == "vr-cisco_xrv9k" {
		log.Info("CiscoIosxrBackup()")
		if action == "backup" {
			var output string
			configFileName := fmt.Sprintf("%s-%s.cfg", configName, time.Now().Format("2006-01-02T15-04-05Z")) // Get the current time
			// configFileName := fmt.Sprintf("%s.cfg", configName) // Get the current time

			iosxrDevice, err := netmigo.InitIOSXRDevice(ipAddress, "clab", "clab@123", 22)
			if err != nil {
				log.Error(err)
			}

			err = iosxrDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// execute running config save
			saveRunningCommand := configFileName
			output, err = iosxrDevice.CopyRunningConfig(saveRunningCommand, "running", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("CiscoIosxrBackup() - output of `save file running-config.json from running`: %s", output)

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)         // path in TopoViewer server
			remotePath := filepath.Join("/misc/scratch/", configFileName) // path in iosxr device

			log.Infof("CiscoIosxrBackup() - localPath`: %s", localPath)
			log.Infof("CiscoIosxrBackup() - remotePath`: %s", remotePath)

			err = iosxrDevice.RetrieveFile(remotePath, localPath)
			if err != nil {
				log.Error(err)
			}

			iosxrDevice.Disconnect()

			log.Infof("CiscoIosxrBackup() - deviceType: %s", deviceKind)

		} else if action == "running" {
			var output string
			configFileName := fmt.Sprintf("%s-running.cfg", configName)
			log.Infof("CiscoIosxrRunning() - deviceType: %s", deviceKind)

			iosxrDevice, err := netmigo.InitIOSXRDevice(ipAddress, "clab", "clab@123", 22)
			if err != nil {
				log.Error(err)
			}

			err = iosxrDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// execute running config save
			saveRunningCommand := configFileName
			output, err = iosxrDevice.CopyRunningConfig(saveRunningCommand, "running", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("CiscoIosxrRunning() - output of save file %s from running`: %s", configFileName, output)

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)         // path in TopoViewer server
			remotePath := filepath.Join("/misc/scratch/", configFileName) // path in iosxr device

			log.Infof("CiscoIosxrRunning() - localPath`: %s", localPath)
			log.Infof("CiscoIosxrRunning() - remotePath`: %s", remotePath)

			err = iosxrDevice.RetrieveFile(remotePath, localPath)
			if err != nil {
				log.Error(err)
			}

			iosxrDevice.Disconnect()

		} else if action == "restore" {
			var output string
			configFileName := configName

			log.Infof("CiscoIosxrRestore() - deviceType: %s", deviceKind)

			iosxrDevice, err := netmigo.InitIOSXRDevice(ipAddress, "clab", "clab@123", 22)
			if err != nil {
				log.Error(err)
			}
			err = iosxrDevice.Connect()
			if err != nil {
				log.Error(err)
			}

			// retrieve saved running config from device to TopoViewer server
			localPath := filepath.Join(directory, configFileName)         // path in TopoViewer server
			remotePath := filepath.Join("/misc/scratch/", configFileName) // path in iosxr device

			log.Infof("CiscoIosxrRestore() - localPath`: %s", localPath)
			log.Infof("CiscoIosxrRestore() - remotePath`: %s", remotePath)

			err = iosxrDevice.FileTransfer(localPath, remotePath)
			if err != nil {
				log.Error(err)
			}

			// Send a set of config command
			// loadConfigCommand := fmt.Sprintf("load replace %s", configFileName)
			output, err = iosxrDevice.LoadRunningConfig(configFileName, "candidate", 10*time.Second)
			if err != nil {
				log.Error(err)
			}
			log.Infof("CiscoIosxrRestore() - output of LoadRunningConfig() %s ", output)
			iosxrDevice.Disconnect()
		}
	} else {
		log.Errorf("Unsupported device type: %s", deviceKind)
		return fmt.Errorf("unsupported device type: %s", deviceKind)

	}

	return nil
}
