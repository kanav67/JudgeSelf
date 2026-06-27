package sandbox

import (
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

	if compileCmd == "" {
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
		"--run", "--", compileCmd,
	)
	args = append(args, additionalArgs...)

	cmd := exec.Command("isolate", args...)
	output, err := cmd.CombinedOutput()
	stderr := err.Error()

	if err != nil {
		return nil, &Result{
			Message:         "Compilation failed",
			Stdin:           "",
			Stdout:          string(output),
			Stderr:          stderr,
			IsolateMetadata: s.GetParsedMetadata(),
		}
	}

	outputBin, err := os.ReadFile(filepath.Join(s.BoxDir, "outputBin"))
	if err != nil {
		return nil, &Result{
			Message:         fmt.Sprintf("Failed to read compiled binary: %v", err),
			Stdin:           "",
			Stdout:          string(output),
			Stderr:          stderr,
			IsolateMetadata: s.GetParsedMetadata(),
		}
	}

	return outputBin, &Result{
		Stdin:           "",
		Stdout:          string(output),
		Stderr:          stderr,
		IsolateMetadata: s.GetParsedMetadata(),
	}
}
