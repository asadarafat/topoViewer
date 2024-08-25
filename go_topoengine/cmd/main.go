package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/ssh"
)

// PodConfig holds the configuration for each pod
type PodConfig struct {
	Namespace       string `mapstructure:"namespace"`
	PodName         string `mapstructure:"podName"`
	PodNameWildCard bool   `mapstructure:"podNameWildCard"`
	ContainerName   string `mapstructure:"containerName"`
	LogFilePath     string `mapstructure:"logFilePath"`
}

type Config struct {
	Loki struct {
		URL string `mapstructure:"url"`
	} `mapstructure:"loki"`
	SSH struct {
		RemoteHost     string `mapstructure:"remoteHost"`
		RemotePort     string `mapstructure:"remotePort"`
		RemoteUser     string `mapstructure:"remoteUser"`
		RemotePassword string `mapstructure:"remotePassword"`
	} `mapstructure:"ssh"`
	Pods []PodConfig `mapstructure:"pods"`
}

func main() {
	// Specify the path to the configuration file
	configFilePath := "/var/asad/topoViewer/config/antareja-config.yaml"

	// Load configuration
	config, err := loadConfig(configFilePath)
	if err != nil {
		log.Fatalf("Error loading config file: %s", err)
	}

	client := &http.Client{}

	for _, pod := range config.Pods {
		go func(pod PodConfig) {
			if pod.PodNameWildCard {
				// If the pod name is a wildcard, resolve it first
				// resolvedPodName, err := resolvePodName(pod.Namespace, pod.PodName)
				if err != nil {
					log.Errorf("Failed to resolve pod name: %v", err)
					return
				}
				// pod.PodName = resolvedPodName
			}
			streamLogs(pod.Namespace, pod.PodName, pod.ContainerName, pod.LogFilePath, config.SSH.RemoteHost, config.SSH.RemotePort, config.SSH.RemoteUser, config.SSH.RemotePassword, config.Loki.URL, pod.PodNameWildCard, client)
		}(pod)
	}

	// Prevent the main function from exiting
	select {}
}

// loadConfig reads the YAML configuration file from the specified path
func loadConfig(configFilePath string) (Config, error) {
	viper.SetConfigFile(configFilePath)

	if err := viper.ReadInConfig(); err != nil {
		return Config{}, fmt.Errorf("error reading config file: %w", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return Config{}, fmt.Errorf("unable to decode config into struct: %w", err)
	}

	return config, nil
}

func streamLogs(namespace, podName, containerName, logFilePath, remoteHost, remotePort, remoteUser, remotePassword, lokiURL string, podNameWildCard bool, client *http.Client) {
	// Setup SSH configuration
	config := &ssh.ClientConfig{
		User: remoteUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(remotePassword),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	// Connect to the remote server
	conn, err := ssh.Dial("tcp", fmt.Sprintf("%s:%s", remoteHost, remotePort), config)
	if err != nil {
		log.Errorf("Failed to connect to remote host: %v", err)
		return
	}
	defer conn.Close()
	session, err := conn.NewSession()
	if err != nil {
		log.Errorf("Failed to create SSH session: %v", err)
		return
	}
	defer session.Close()
	if podNameWildCard {
		// Run the kubectl exec command on the remote host with sudo
		cmd := fmt.Sprintf(`echo "%s" | sudo -S /usr/local/bin/kubectl exec $(echo "Lab-Her0" | sudo -S /usr/local/bin/kubectl get pods -A -l app=%s -o name) -n %s -c %s -- %s`, remotePassword, podName, namespace, containerName, logFilePath)
		log.Infof("Running command: %s", cmd)
		stdout, err := session.StdoutPipe()
		if err != nil {
			log.Errorf("Failed to create stdout pipe: %v", err)
			return
		}
		if err := session.Start(cmd); err != nil {
			log.Errorf("Failed to start command: %v", err)
			return
		}
		reader := bufio.NewScanner(stdout)
		for reader.Scan() {
			logLine := reader.Text()
			err = sendToLoki(client, logLine, podName, containerName, lokiURL)
			if err != nil {
				log.Errorf("Failed to send log to Loki: %v", err)
			}
		}
		if err := reader.Err(); err != nil {
			log.Errorf("Error reading log lines: %v", err)
		}
		if err := session.Wait(); err != nil {
			exitError, ok := err.(*ssh.ExitError)
			if ok {
				log.Errorf("Command exited with non-zero status: %d", exitError.ExitStatus())
			} else {
				log.Errorf("Failed to wait for command: %v", err)
			}
		}
	} else {
		// Run the kubectl exec command on the remote host with sudo
		cmd := fmt.Sprintf(`echo "%s" | sudo -S /usr/local/bin/kubectl exec %s -n %s -c %s -- %s`, remotePassword, podName, namespace, containerName, logFilePath)
		log.Infof("Running command: %s", cmd)
		stdout, err := session.StdoutPipe()
		if err != nil {
			log.Errorf("Failed to create stdout pipe: %v", err)
			return
		}
		if err := session.Start(cmd); err != nil {
			log.Errorf("Failed to start command: %v", err)
			return
		}
		reader := bufio.NewScanner(stdout)
		for reader.Scan() {
			logLine := reader.Text()
			err = sendToLoki(client, logLine, podName, containerName, lokiURL)
			if err != nil {
				log.Errorf("Failed to send log to Loki: %v", err)
			}
		}
		if err := reader.Err(); err != nil {
			log.Errorf("Error reading log lines: %v", err)
		}
		if err := session.Wait(); err != nil {
			exitError, ok := err.(*ssh.ExitError)
			if ok {
				log.Errorf("Command exited with non-zero status: %d", exitError.ExitStatus())
			} else {
				log.Errorf("Failed to wait for command: %v", err)
			}
		}
	}
}

func sendToLoki(client *http.Client, logLine, podName, containerName, lokiURL string) error {
	var timestampStr string
	var timestamp time.Time
	var err error

	// Check the podName and apply the appropriate regex and parsing logic
	if podName == "nsp-mdt-ac-0" {
		// Use the timestamp format specific to nsp-mdt-ac-0 (e.g., 14:21:18.948)
		timestampRegex := regexp.MustCompile(`\d{2}:\d{2}:\d{2}\.\d{3}`)
		timestampStr = timestampRegex.FindString(logLine)
		if timestampStr == "" {
			log.Warnf("Could not extract timestamp from log line: %s", logLine)
			return nil
		}

		// Parse the timestamp assuming it's for the current day
		timestamp, err = time.Parse("15:04:05.000", timestampStr)
		if err != nil {
			log.Warnf("Failed to parse timestamp for nsp-mdt-ac-0: %v", err)
			return nil
		}

		// Add the current date to the timestamp to create a complete timestamp
		timestamp = time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), timestamp.Hour(), timestamp.Minute(), timestamp.Second(), timestamp.Nanosecond(), time.Local)
	} else {
		// Default timestamp format (e.g., 2024.08.21 14:21:18)
		timestampRegex := regexp.MustCompile(`\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}`)
		timestampStr = timestampRegex.FindString(logLine)
		if timestampStr == "" {
			log.Warnf("Could not extract timestamp from log line: %s", logLine)
			return nil
		}

		// Replace dots with hyphens to match Loki's expected format
		formattedTimestampStr := strings.Replace(timestampStr, ".", "-", 2)

		// Parse the extracted timestamp
		timestamp, err = time.Parse("2006-01-02 15:04:05", formattedTimestampStr)
		if err != nil {
			log.Warnf("Failed to parse timestamp: %v", err)
			return nil
		}
	}

	// Convert the parsed timestamp to Unix epoch in nanoseconds
	timestampNano := timestamp.UnixNano()

	// Build Loki payload
	payload := map[string]interface{}{
		"streams": []map[string]interface{}{
			{
				"stream": map[string]string{
					"job":       "antareja",
					"pod":       podName,
					"container": containerName,
				},
				"values": [][]string{
					{
						fmt.Sprintf("%d", timestampNano),
						logLine,
					},
				},
			},
		},
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON payload: %w", err)
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/loki/api/v1/push", lokiURL), bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Log different responses accordingly
	if resp.StatusCode == http.StatusOK {
		log.Infof("Successfully sent log to Loki.")
	} else if resp.StatusCode == http.StatusNoContent {
		log.Infof("Loki accepted the log with no content returned (204 No Content).")
	} else {
		return fmt.Errorf("received unexpected status code: %s", resp.Status)
	}

	return nil
}
