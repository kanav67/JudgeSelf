package sandbox

import (
	"bufio"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Result struct {
	Message         string
	Stdin           string
	Stdout          string
	Stderr          string
	IsolateMetadata *IsolateMetadata
}

type IsolateMetadata struct {
	Time     float64
	WallTime float64
	Memory   int
	ExitCode int
	ExitSig  int
	Status   string
	Message  string
}

func (s *Sandbox) GetParsedMetadata() *IsolateMetadata {
	meta := &IsolateMetadata{}

	file, err := os.Open(s.GetMetadataPath())
	if err != nil {
		return nil // Return empty struct if missing
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	//todo
	if scanner.Err() != nil {
		return nil // Return empty struct if error reading
	}

	cgMem := -1

	for scanner.Scan() {
		parts := strings.SplitN(scanner.Text(), ":", 2)
		if len(parts) != 2 {
			continue
		}

		key, val := parts[0], parts[1]
		switch key {
		case "time":
			meta.Time, _ = strconv.ParseFloat(val, 64)
		case "time-wall":
			meta.WallTime, _ = strconv.ParseFloat(val, 64)
		case "cg-mem":
			cgMem, _ = strconv.Atoi(val)
		case "max-rss":
			meta.Memory, _ = strconv.Atoi(val)
		case "exitcode":
			meta.ExitCode, _ = strconv.Atoi(val)
		case "exitsig":
			meta.ExitSig, _ = strconv.Atoi(val)
		case "status":
			meta.Status = val
		case "message":
			meta.Message = val
		}
	}

	//for future
	if cgMem != -1 {
		meta.Memory = cgMem
	}

	return meta
}

func (s *Sandbox) GetMetadataPath() string {
	return filepath.Join(s.BoxDir, MetadataFile)
}