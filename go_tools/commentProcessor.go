package tools

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

// aarafat-tag:
// This tools will parse file and detect comment line in javascript and parse it to (custom) go-template's friendly template file
// ie: from: "// line of comment"" to be "{{rawJSComment // line of comment}}"

func CommentProcessor(inputFileName string, outputFileName string) {

	log.Info(inputFileName)
	log.Info(outputFileName)

	// Open the input file
	inputFile, err := os.Open(inputFileName)
	if err != nil {
		fmt.Println("Error opening input file:", err)
		return
	}
	defer inputFile.Close()

	// Check if the output file already exists
	if _, err := os.Stat(outputFileName); err == nil {
		// Output file exists, create a backup
		backupFileName := fmt.Sprintf("%s.bak_%s", outputFileName, time.Now().Format("20060102150405"))
		err := os.Rename(outputFileName, backupFileName)
		if err != nil {
			fmt.Println("Error creating backup:", err)
			return
		}
		log.Infof("Backup created: %s\n", backupFileName)
	}

	//// Create an output file
	outputFile, err := os.Create(outputFileName)
	if err != nil {
		fmt.Println("Error creating output file:", err)
		return
	}
	defer outputFile.Close()

	// Create a scanner to read the input file line by line
	scanner := bufio.NewScanner(inputFile)
	// Regular expression to match lines that start with optional whitespace followed by "//"
	re := regexp.MustCompile(`^\s*//`)

	for scanner.Scan() {
		line := scanner.Text()

		if re.MatchString(line) {
			log.Info("found line //")
			log.Info(line)
			// Wrap the line with {{rawJSComment " "}}
			modifiedLine := fmt.Sprintf("{{rawJSComment \"%s\"}}", strings.TrimPrefix(line, "//"))
			_, err := fmt.Fprintln(outputFile, modifiedLine)
			if err != nil {
				log.Info("Error writing to output file:", err)
				return
			}
		} else {
			// Write the line as-is to the output file
			_, err := fmt.Fprintln(outputFile, line)
			if err != nil {
				log.Info("Error writing to output file:", err)
				return
			}
		}
	}

	// Check for any scanner errors
	if err := scanner.Err(); err != nil {
		log.Info("Error scanning input file:", err)
		return
	}
	log.Info(outputFileName)
	log.Infof("File \"%s\" successfully modified and saved as \"%s\"\n", inputFileName, outputFileName)

}
