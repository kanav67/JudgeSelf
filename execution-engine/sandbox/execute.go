package sandbox

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func (s *Sandbox) ExecuteCode(sourceBin []byte, language, stdinFilePath, stdoutFilePath string, additionalArgs []string, config *IsolateConfig) *IsolateMetadata {
	s.ReInitialize()

	destPath := filepath.Join(s.BoxDir, "source")
	_ = os.WriteFile(destPath, sourceBin, 0755)

	executeCmd, exists := GetExecuteCommand(language, "source")

	//todo
	if !exists {
		fmt.Errorf("Unsupported checker language: %s", language)
		return nil
	}

	args := s.baseIsolateArgs()
	args = append(args, config.toArgs()...)
	args = append(args,
		"-M", MetadataFile,
		"-E", "HOME=/tmp",
		"-E", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
		"--run", "--", executeCmd,
	)
	args = append(args, additionalArgs...)
	
	cmd := exec.Command("isolate", args...)

	if stdinFilePath != "" {
		stdin, _ := os.OpenFile(stdinFilePath, os.O_RDONLY, 0)
		defer stdin.Close()
		cmd.Stdin = stdin
	}

	if stdoutFilePath != "" {
		stdout, _ := os.OpenFile(
			stdoutFilePath, 
			os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 
			0644,
		)
		defer stdout.Close()
		cmd.Stdout = stdout
	}

	_ = cmd.Run()

	return s.GetParsedMetadata()
}