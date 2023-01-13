package tools

import (
	"io/ioutil"
	"log"
)

func CopyFileCheckErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func CopyFile(src string, dst string) {
	// Read all content of src to data, may cause OOM for a large file.
	data, err := ioutil.ReadFile(src)
	CopyFileCheckErr(err)
	// Write data to dst
	err = ioutil.WriteFile(dst, data, 0644)
	CopyFileCheckErr(err)
}

func RemoveDuplicateNodesValues(intSlice []string) []string {
	keys := make(map[string]bool)
	list := []string{}

	// If the key(values of the slice) is not equal
	// to the already present value in new slice (list)
	// then we append it. else we jump on another element.
	for _, entry := range intSlice {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}
