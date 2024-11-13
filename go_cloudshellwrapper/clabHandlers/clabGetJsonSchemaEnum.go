package clabhandlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	log "github.com/sirupsen/logrus"
	"github.com/tidwall/gjson"
)

// ClabGetKindEnumHandler reads the JSON schema from the provided file path,
// recursively searches for the 'kind' enum values, and returns them as JSON bytes.
func ClabGetNodeKindEnumHandler(w http.ResponseWriter, r *http.Request, schemaFilePath string) ([]byte, error) {
	// Read the schema file
	schemaData, err := os.ReadFile(schemaFilePath)
	if err != nil {
		log.WithFields(log.Fields{
			"schema_file": schemaFilePath,
			"error":       err,
		}).Error("Failed to read schema file")
		return nil, err
	}

	// Use gjson to navigate directly to the path: definitions -> node-config -> properties -> kind -> enum
	enumPath := "definitions.node-config.properties.kind.enum"
	enumResult := gjson.GetBytes(schemaData, enumPath)

	if !enumResult.Exists() {
		errMsg := "'enum' path not found in JSON"
		log.Error(errMsg)
		http.Error(w, errMsg, http.StatusNotFound)
		return nil, errors.New(errMsg)
	}

	// Convert gjson array to []string
	var kindEnums []string
	enumResult.ForEach(func(_, value gjson.Result) bool {
		kindEnums = append(kindEnums, value.String())
		return true
	})

	responseJSON, err := json.Marshal(kindEnums)
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Error("Failed to marshal enum values to JSON")
		return nil, err
	}

	log.WithFields(log.Fields{
		"enum_count": len(kindEnums),
	}).Info("Successfully extracted 'kind' enums")

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(kindEnums)
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Error("Failed to write response")
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return nil, err
	}

	return responseJSON, nil
}

// ClabGetNodeKindTypeEnumHandler reads the JSON schema from the provided file path,
// traverses the schema to extract 'type' enum values based on the provided 'kind' pattern
// and returns them as JSON bytes.
func ClabGetNodeKindTypeEnumHandler(w http.ResponseWriter, r *http.Request, schemaFilePath string, kindPatternInput string) ([]byte, error) {
	// Read the schema file
	schemaData, err := os.ReadFile(schemaFilePath)
	if err != nil {
		log.WithFields(log.Fields{
			"schema_file": schemaFilePath,
			"error":       err,
		}).Error("Failed to read schema file")
		return nil, err
	}

	// Use gjson to navigate directly to the allOf path
	allOfPath := "definitions.node-config.allOf"
	allOfResult := gjson.GetBytes(schemaData, allOfPath)

	if !allOfResult.Exists() {
		errMsg := "'allOf' path not found in JSON"
		log.Error(errMsg)
		http.Error(w, errMsg, http.StatusNotFound)
		return nil, errors.New(errMsg)
	}

	var typeEnums []string

	allOfResult.ForEach(func(_, value gjson.Result) bool {
		ifCond := value.Get("if.properties.kind.pattern")
		thenEnum := value.Get("then.properties.type.enum")

		// Match patterns explicitly for specific conditions
		if ifCond.Exists() {
			switch ifCond.String() {
			case "(srl|nokia_srlinux)":
				if kindPatternInput == "srl" || kindPatternInput == "nokia_srlinux" {
					if thenEnum.Exists() {
						thenEnum.ForEach(func(_, v gjson.Result) bool {
							typeEnums = append(typeEnums, v.String())
							return true
						})
						return false // Stop iteration after finding the matching pattern
					}
				}
			case "(vr-sros|vr-nokia_sros)":
				if kindPatternInput == "vr-sros" || kindPatternInput == "vr-nokia_sros" {
					if thenEnum.Exists() {
						thenEnum.ForEach(func(_, v gjson.Result) bool {
							typeEnums = append(typeEnums, v.String())
							return true
						})
						return false // Stop iteration after finding the matching pattern
					}
				}
			}
		}
		return true
	})

	if len(typeEnums) == 0 {
		http.Error(w, "No matching 'type' enums found for the provided 'kind' pattern", http.StatusNotFound)
		return nil, fmt.Errorf("no 'type' enums found for kind pattern '%s'", kindPatternInput)
	}

	responseJSON, err := json.Marshal(typeEnums)
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Error("Failed to marshal type enums to JSON")
		return nil, err
	}

	log.WithFields(log.Fields{
		"type_enum_count": len(typeEnums),
		"kind_pattern":    kindPatternInput,
	}).Info("Successfully extracted 'type' enums")

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(typeEnums)
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Error("Failed to write response")
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return nil, err
	}

	return responseJSON, nil
}
