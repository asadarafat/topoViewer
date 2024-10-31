package tools

import (
	"fmt"
	"io"

	"os"

	"github.com/pkg/sftp"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"

	netmigo "github.com/asadarafat/netmiGO/netmigo"
)

// SCPDirection represents the direction of the file transfer.
type SCPDirection int

const (
	// SCPGet transfers a file from the remote server to the local machine.
	SCPGet SCPDirection = iota
	// SCPPut transfers a file from the local machine to the remote server.
	SCPPut
)

// SCPFile transfers a file between localPath and remotePath using SCP-like functionality.
// overwrite determines if existing remote file should be overwritten.
// direction determines if the transfer is from local to remote (SCPPut) or remote to local (SCPGet).
func SCPFile(hostname, username, password, localPath, remotePath string, overwrite bool, direction SCPDirection) error {
	// Create SSH client config
	sshConfig := &ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // WARNING: Insecure; use proper host key verification in production
	}

	// Establish SSH connection
	sshClient, err := ssh.Dial("tcp", fmt.Sprintf("%s:22", hostname), sshConfig)
	if err != nil {
		log.Errorf("failed to establish SSH connection: %v", err)
		return fmt.Errorf("failed to establish SSH connection: %v", err)
	}
	defer sshClient.Close()

	// Create SFTP session
	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		return fmt.Errorf("failed to create SFTP session: %v", err)
	}
	defer sftpClient.Close()

	switch direction {
	case SCPPut:
		// Open local file for reading
		localFile, err := os.Open(localPath)
		if err != nil {
			return fmt.Errorf("failed to open local file: %v", err)
		}
		defer localFile.Close()

		// Check if remote file exists
		if _, err := sftpClient.Stat(remotePath); err == nil && !overwrite {
			return fmt.Errorf("remote file already exists and overwrite is disabled")
		}

		// Create remote file for writing
		remoteFile, err := sftpClient.Create(remotePath)
		if err != nil {
			return fmt.Errorf("failed to create remote file: %v", err)
		}
		defer remoteFile.Close()

		// Copy file content from local to remote
		_, err = io.Copy(remoteFile, localFile)
		if err != nil {
			return fmt.Errorf("failed to copy file: %v", err)
		}

		log.Infof("File transferred successfully via SCP (PUT): %s -> %s\n", localPath, remotePath)

	case SCPGet:
		// Open remote file for reading
		remoteFile, err := sftpClient.Open(remotePath)
		if err != nil {
			return fmt.Errorf("failed to open remote file: %v", err)
		}
		defer remoteFile.Close()

		// Create local file for writing
		localFile, err := os.Create(localPath)
		if err != nil {
			return fmt.Errorf("failed to create local file: %v", err)
		}
		defer localFile.Close()

		// Copy file content from remote to local
		_, err = io.Copy(localFile, remoteFile)
		if err != nil {
			return fmt.Errorf("failed to copy file: %v", err)
		}

		log.Infof("File transferred successfully via SCP (GET): %s <- %s\n", localPath, remotePath)
	}

	return nil
}

func exampleBasicSROS() {

	Router10, err := netmigo.InitSROSDevice("10.2.1.109", "admin", "admin", 22)
	if err != nil {
		log.Fatal(err)
	}

	// Open session with Router10
	if err := Router10.Connect(); err != nil {
		log.Fatal(err)
	}

	// Transfer a file
	if err := Router10.FileTransfer("examples/clab-nokia-ServiceProvider-R09-PE-ASBR-running.cfg", "cf3:/clab-nokia-ServiceProvider-R09-PE-ASBR-running.cfg"); err != nil {
		log.Fatal(err)
	}

	// Send command
	output1, _ := Router10.SendCommand("show port")
	output2, _ := Router10.SendCommand("show uptime")

	// Send config command for classic CLI
	_, _ = Router10.SendCommand("show version")
	_, _ = Router10.SendCommand("admin save")

	// Send a set of config commands
	commands := []string{"show version", "load full-replace cf3:clab-nokia-ServiceProvider-R09-PE-ASBR-running.cfg"}
	output3, _ := Router10.SendConfigSet(commands)

	Router10.Disconnect()

	fmt.Println(output1)
	fmt.Println(output2)
	fmt.Println(output3)
}
