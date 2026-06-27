package worker

import (
	"execution-engine/job"
	"execution-engine/sandbox"
	"os"
	"strconv"
	"strings"
)

func (w *Worker) CompileCheckerCode() ([]byte, job.Result) {
	checkerLanguage := w.Job.ProblemData.CheckerLanguage
	checkerSource, _ := os.ReadFile(w.Job.ProblemData.GetCheckerSourcePath())
	checkerBin, result := w.Sandbox.CompileCode(
		checkerSource,
		checkerLanguage,
		w.Job.ProblemData.GetResourcesFolder(),
		nil,
		GetDefaultConfig(),
	)

	if checkerBin == nil {
		if result.IsolateMetadata != nil {
			result.Message = "Checker compilation failed\n" + IsolateMetadataToString(result.IsolateMetadata)
		}

		return nil, FormatInternalError(result)
	}

	return checkerBin, job.Result{}
}

func (w *Worker) CompileUserCode() ([]byte, job.Result) {
	userCodeSource := []byte(w.Job.SubmissionData.SourceCode)
	userCodeLanguage := w.Job.SubmissionData.SourceLanguage

	userCodeBin, result := w.Sandbox.CompileCode(userCodeSource, userCodeLanguage, "", nil, GetDefaultConfig())
	if userCodeBin == nil {
		if result.IsolateMetadata == nil {
			return nil, FormatInternalError(result)
		}

		status, message := IsolateMetadataFormat(result.IsolateMetadata)
		if(status == "INT"){
			result.Message = "Usercode Compilation failed, (Internal error by sandbox) \n" + IsolateMetadataToString(result.IsolateMetadata)
			return nil, FormatInternalError(result)
		}
		if(status == "AC"){
			result.Message = "Usercode Compilation failed, (Code compiled successfully but no bin was generated) \n" + IsolateMetadataToString(result.IsolateMetadata)
			return nil, FormatInternalError(result)
		}

		return nil, job.Result{
			Test:          0,
			Memory:        result.IsolateMetadata.Memory,
			Time:          result.IsolateMetadata.Time,
			Status:        "CE",
			Message:       message,
			InputSnippet:  result.Stdin,
			OutputSnippet: result.Stdout,
			AnswerSnippet: result.Stderr,
		}
	}

	return userCodeBin, job.Result{}
}

// returns status, message
func IsolateMetadataFormat(metadata *sandbox.IsolateMetadata) (string, string) {
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

func FormatInternalError(result *sandbox.Result) job.Result {
	return job.Result{
		Test:          0,
		Memory:        0,
		Time:          0,
		Status:        "INT",
		Message:       result.Message,
		InputSnippet:  MessageToSnippet(result.Stdin),
		OutputSnippet: result.Stdout + "\n Stderr: \n" + result.Stderr,
		AnswerSnippet: "",
	}
}

func MessageToSnippet(message string) string {
	if len(message) > 500 {
		return message[:500] + "..."
	}
	return message
}
