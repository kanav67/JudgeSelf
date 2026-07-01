package sandbox

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

func (s *Sandbox) ExecuteCode(sourceBin []byte, language, stdinFilePath, stdoutFilePath, stderrFilePath string, additionalArgs []string, config *IsolateConfig) *Result {
	s.ReInitialize()

	destPath := filepath.Join(s.BoxDir, "source")
	_ = os.WriteFile(destPath, sourceBin, 0755)

	//assuming language is valid as compile command would have caught it
	executeCmd, _ := GetExecuteCommand(language, "source")

	args := s.baseIsolateArgs()
	args = append(args, config.toArgs()...)
	args = append(args,
		"-M", s.GetMetadataPath(),
		"-E", "HOME=/tmp",
		"-E", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
		"--run", "--",
	)
	args = append(args, executeCmd...)
	args = append(args, additionalArgs...)

	cmd := exec.Command("isolate", args...)

	log.Printf("Executing cmd %s", cmd.String())

	//initialize inputs
	if stdinFilePath == "" {
		stdinFilePath = s.GetDefaultStdinPath()
	}
	if stdoutFilePath == "" {
		stdoutFilePath = s.GetDefaultStdoutPath()
	}
	if stderrFilePath == "" {
		stderrFilePath = s.GetDefaultStderrPath()
	}

	stdin, _ := os.OpenFile(stdinFilePath, os.O_RDONLY, 0)
	defer stdin.Close()
	cmd.Stdin = stdin

	//ensure dir exists
	os.MkdirAll(filepath.Dir(stdoutFilePath), 0755)
	stdout, _ := os.OpenFile(
		stdoutFilePath,
		os.O_WRONLY|os.O_CREATE|os.O_TRUNC,
		0644,
	)
	defer stdout.Close()
	cmd.Stdout = stdout

	os.MkdirAll(filepath.Dir(stderrFilePath), 0755)
	stderr, _ := os.OpenFile(
		stderrFilePath,
		os.O_WRONLY|os.O_CREATE|os.O_TRUNC,
		0644,
	)
	defer stderr.Close()
	cmd.Stderr = stderr

	//execute
	err := cmd.Run()

	message := "Execution completed"
	if err != nil {
		message = "Execution failed with error: " + err.Error()
	}

	//since inputs or outputs can be large we avoid reading them into memory whole
	stdinSnippet, _ := ReadSnippet(stdinFilePath)
	stdoutSnippet, _ := ReadSnippet(stdoutFilePath)
	stderrSnippet, _ := ReadSnippet(stderrFilePath)

	return &Result{
		Message:         message,
		Stdin:           stdinSnippet,
		Stdout:          stdoutSnippet,
		Stderr:          stderrSnippet,
		IsolateMetadata: s.GetParsedMetadata(),
	}
}
