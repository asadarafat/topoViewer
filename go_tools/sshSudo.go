package tools

import (
	"bufio"
	"io"
	"net"
	"strings"

	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
)

type Connection struct {
	*ssh.Client
	password string
}

func Connect(addr, user, password string) (*Connection, error) {
	sshConfig := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.HostKeyCallback(func(hostname string, remote net.Addr, key ssh.PublicKey) error { return nil }),
	}

	conn, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		log.Errorf("<tools><E><Connect() error: %v>", err)
		return nil, err
	}

	return &Connection{conn, password}, nil

}

func (conn *Connection) SendCommands(cmds ...string) ([]byte, error) {
	session, err := conn.NewSession()
	if err != nil {
		log.Errorf("<tools><E><SendCommands() error: %v>", err)
	}
	defer session.Close()

	modes := ssh.TerminalModes{
		ssh.ECHO:          0,     // disable echoing
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}

	err = session.RequestPty("xterm", 80, 40, modes)
	if err != nil {
		log.Errorf("<tools><E><SendCommands() error: %v>", err)
		return []byte{}, err
	}

	in, err := session.StdinPipe()
	if err != nil {
		log.Errorf("<tools><E><SendCommands() error: %v>", err)

	}

	out, err := session.StdoutPipe()
	if err != nil {
		log.Errorf("<tools><E><SendCommands() error: %v>", err)

	}

	var output []byte

	go func(in io.WriteCloser, out io.Reader, output *[]byte) {
		var (
			line string
			r    = bufio.NewReader(out)
		)
		for {
			b, err := r.ReadByte()
			if err != nil {
				break
			}

			*output = append(*output, b)

			if b == byte('\n') {
				line = ""
				continue
			}

			line += string(b)

			if strings.HasPrefix(line, "[sudo] password for ") && strings.HasSuffix(line, ": ") {
				_, err = in.Write([]byte(conn.password + "\n"))
				if err != nil {
					log.Errorf("<tools><E><SendCommands() error: %v>", err)
					break
				}
			}
		}
	}(in, out, &output)

	cmd := strings.Join(cmds, "; ")
	_, err = session.Output(cmd)
	if err != nil {
		log.Errorf("<tools><E><SendCommands() error: %v>", err)
		return []byte{}, err
	}

	return output, nil
}

func SshSudo(neHost string, nePort string, neUser string, nePass string, cmds ...string) ([]byte, error) {

	// // Command to execute the Python script
	// cmd := exec.Command("python3", "./html-static/actions/exampleScript.py", "arg1", "arg2")
	// // cmd := exec.Command("whoami")

	// // Capture standard output and error
	// out, err := cmd.CombinedOutput()
	// if err != nil {
	// 	log.Fatalf("Failed to execute Python script: %v", err)
	// }

	// // Print the output
	// fmt.Printf("Python script output:\n%s\n", out)
	// log.Infof("<tools><E><SshSudo() error: %v>", err)

	// ssh refers to the custom package above
	conn, err := Connect(neHost+":"+nePort, neUser, nePass)
	if err != nil {
		log.Errorf("<tools><E><SshSudo() error: %v>", err)
	}

	commandString := strings.Join(cmds, "; ")
	output, err := conn.SendCommands("sudo " + commandString)

	if err != nil {
		log.Errorf("<tools><E><SshSudo() error: %v>", err)

	}
	log.Infof("<tools><E><SshSudo() executing command string: %s>", commandString)
	log.Infof("<tools><E><SshSudo() excuting command string: %s>", string(output))

	return output, err
}
