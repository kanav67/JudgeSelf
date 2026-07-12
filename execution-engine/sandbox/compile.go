package sandbox

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

const CompileTimeLimit = 5.0
const CompileMemoryLimit = 256 * 1024 // 256 MB

func (s *Sandbox) CompileCode(sourceCode []byte, language, additionalFilesDir string, additionalArgs []string, config *IsolateConfig) ([]byte, *Result) {
	s.ReInitialize()

	compileCmd, exists := GetCompileCommand(language, "source", "outputBin")
	if !exists {
		return nil, &Result{
			Message: fmt.Sprintf("Unsupported language: %s", language),
		}
	}

	if len(compileCmd) == 0 {
		return sourceCode, &Result{}
	}

	sourcePath := filepath.Join(s.BoxDir, "source")
	err := os.WriteFile(sourcePath, sourceCode, 0644)
	if err != nil {
		return nil, &Result{
			Message: fmt.Sprintf("Failed to write source code to file: %v", err),
		}
	}

	if additionalFilesDir != "" {
		CopyDirFiles(additionalFilesDir, s.BoxDir)
	}

	args := s.baseIsolateArgs()
	args = append(args, config.toArgs()...)
	args = append(args,
		"-M", s.GetMetadataPath(),
		"-E", "HOME=/tmp",
		"-E", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
		"-d", "/etc:noexec",
		"-p",
		"--run", "--",
	)
	args = append(args, compileCmd...)
	args = append(args, additionalArgs...)

	cmd := exec.Command("isolate", args...)

	//we can use buffers to capture stdout and stderr since compilation outputs are usually small
	//maybe in future switch to files only
	var stdout, stderr *bytes.Buffer
	stdout = &bytes.Buffer{}
	stderr = &bytes.Buffer{}

	cmd.Stdout = stdout
	cmd.Stderr = stderr

	err = cmd.Run()

	if err != nil {
		return nil, &Result{
			Message:         "Compilation failed with error: " + err.Error(),
			Stdin:           "",
			Stdout:          stdout.String(),
			Stderr:          stderr.String(),
			IsolateMetadata: s.GetParsedMetadata(),
		}
	}

	outputBin, err := os.ReadFile(filepath.Join(s.BoxDir, "outputBin"))
	if err != nil {
		//always discard the read bytes
		return nil, &Result{
			Message:         fmt.Sprintf("Failed to read compiled binary: %v", err),
			Stdin:           "",
			Stdout:          stdout.String(),
			Stderr:          stderr.String(),
			IsolateMetadata: s.GetParsedMetadata(),
		}
	}

	return outputBin, &Result{
		Stdin:           "",
		Stdout:          stdout.String(),
		Stderr:          stderr.String(),
		IsolateMetadata: s.GetParsedMetadata(),
	}
}
