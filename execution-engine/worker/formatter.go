package worker

import (
	"execution-engine/engine"
	"execution-engine/sandbox"
	"strconv"
	"strings"
)

// returns status, message
func FormatIsolateMetadata(metadata *sandbox.IsolateMetadata, isChecker bool) (string, string) {
	switch metadata.Status {
	case "TO":
		return "TLE", "Time limit exceeded"
	case "SG":
		switch metadata.ExitSig {
		case 11:
			return "SIGSEGV", "Runtime Error (SIGSEGV)"
		case 25:
			return "SIGXFSZ", "Runtime Error (SIGXFSZ)"
		case 8:
			return "SIGFPE", "Runtime Error (SIGFPE)"
		case 6:
			return "SIGABRT", "Runtime Error (SIGABRT)"
		default:
			return "RE", "Runtime Error (Other): " + strconv.Itoa(metadata.ExitSig)
		}
	case "RE":
		if isChecker {
			switch metadata.ExitSig {
			case 1, 2:
				return "WA", "Wrong Answer"
			case 3:
				return "FAIL", "Jury Failed"
			default:
				return "FAIL", "Jury Failed with Exit Signal: " + strconv.Itoa(metadata.ExitSig)
			}
		}
		return "NZEC", "Non-Zero Exit Code: " + strconv.Itoa(metadata.ExitCode)
	case "XX":
		return "INT", "Internal error"
	}
	return "AC", ""
}

func IsolateMetadataToString(metadata *sandbox.IsolateMetadata) string {
	return strings.Join([]string{
		"Exit code: " + strconv.Itoa(metadata.ExitCode),
		"Exit signal: " + strconv.Itoa(metadata.ExitSig),
		"Status: " + metadata.Status,
		"Time: " + strconv.FormatFloat(metadata.Time, 'f', 6, 64),
		"Wall time: " + strconv.FormatFloat(metadata.WallTime, 'f', 6, 64),
		"Memory: " + strconv.Itoa(metadata.Memory),
	}, "\n")
}

func FormatResult(result *sandbox.Result, status string) engine.Result {
	memory := 0
	time := 0.0
	if result.IsolateMetadata != nil && status != "INT" {
		memory = result.IsolateMetadata.Memory
		time = result.IsolateMetadata.Time
	}
	return engine.Result{
		Test:          0,
		Memory:        memory,
		Time:          time,
		Status:        status,
		Message:       result.Message,
		InputSnippet:  result.Stdin,
		OutputSnippet: result.Stdout + "\n Stderr: \n" + result.Stderr,
		AnswerSnippet: "",
	}
}
