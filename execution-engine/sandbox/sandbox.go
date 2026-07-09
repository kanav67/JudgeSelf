package sandbox

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

const (
	StdinFile      = "stdin.txt"
	StdoutFile     = "stdout.txt"
	StderrFile     = "stderr.txt"
	MetadataFile   = "metadata.txt"
	MaxBytesToRead = 1 * 1024 //1kb
)

type Sandbox struct {
	BoxID   int
	WorkDir string
	BoxDir  string
}

func NewSandbox(boxID int) (*Sandbox, error) {
	s := &Sandbox{
		BoxID: boxID,
	}

	err := s.ReInitialize()
	if err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Sandbox) ReInitialize() error {
	args := []string{"-b", strconv.Itoa(s.BoxID), "--init"}

	out, err := exec.Command("isolate", args...).Output()
	if err != nil {
		return fmt.Errorf("isolate init failed: %v", err)
	}

	s.WorkDir = strings.TrimSpace(string(out))
	s.BoxDir = filepath.Join(s.WorkDir, "box")

	//todo handle error
	s.InitBaseFiles()

	return nil
}

func (s *Sandbox) InitBaseFiles() error {
	for _, name := range []string{StdinFile, StdoutFile, StderrFile, MetadataFile} {
		_, err := os.Create(filepath.Join(s.BoxDir, name))
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Sandbox) Cleanup() error {
	args := []string{"-b", strconv.Itoa(s.BoxID), "--cleanup"}
	return exec.Command("isolate", args...).Run()
}

func (s *Sandbox) baseIsolateArgs() []string {
	args := []string{"-b", strconv.Itoa(s.BoxID), "--silent"}
	return args
}

func (s *Sandbox) GetDefaultStdinPath() string {
	return filepath.Join(s.BoxDir, StdinFile)
}

func (s *Sandbox) GetDefaultStdoutPath() string {
	return filepath.Join(s.BoxDir, StdoutFile)
}

func (s *Sandbox) GetDefaultStderrPath() string {
	return filepath.Join(s.BoxDir, StderrFile)
}
