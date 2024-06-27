package tools

import (
	"bytes"
	"strings"

	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
)

func Ssh(neHost string, nePort string, neUser string, nePass string, cmds ...string) ([]byte, error) {
	config := &ssh.ClientConfig{
		User: neUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(nePass),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	log.Infof("RunSSHCommand Function: '%s'", cmds)

	client, err := ssh.Dial("tcp", neHost+":"+nePort, config)
	if err != nil {
		log.Errorf("failed to dial SSH: '%s'", err)
		return nil, err
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		log.Errorf("failed to create SSH session: %s", err)
		return nil, err
	}
	defer session.Close()

	var stdoutBuf, stderrBuf bytes.Buffer
	session.Stdout = &stdoutBuf
	session.Stderr = &stderrBuf

	cmd := strings.Join(cmds, "; ")

	if err := session.Run(cmd); err != nil {
		log.Errorf("failed to run SSH command: %s", err)
		return nil, err
	}

	log.Info(stdoutBuf)

	return stdoutBuf.Bytes(), err
}
