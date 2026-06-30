package worker

import (
	"execution-engine/engine"
	"os"
)

func (w *Worker) CompileCheckerCode() ([]byte, engine.Result) {
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

		return nil, FormatResult(result, "INT")
	}

	return checkerBin, engine.Result{}
}

func (w *Worker) CompileUserCode() ([]byte, engine.Result) {
	userCodeSource := []byte(w.Job.SubmissionData.SourceCode)
	userCodeLanguage := w.Job.SubmissionData.SourceLanguage

	userCodeBin, result := w.Sandbox.CompileCode(userCodeSource, userCodeLanguage, "", nil, GetDefaultConfig())
	if userCodeBin == nil {
		if result.IsolateMetadata == nil {
			return nil, FormatResult(result, "INT")
		}

		status, message := FormatIsolateMetadata(result.IsolateMetadata, false)
		if status == "INT" {
			result.Message = "Usercode Compilation failed, (Internal error by sandbox) \n" + IsolateMetadataToString(result.IsolateMetadata)
			return nil, FormatResult(result, "INT")
		}
		if status == "AC" {
			result.Message = "Usercode Compilation failed, (Code compiled successfully but no bin was generated) \n" + IsolateMetadataToString(result.IsolateMetadata)
			return nil, FormatResult(result, "INT")
		}
		result.Message = message

		return nil, FormatResult(result, "CE")
	}

	return userCodeBin, engine.Result{}
}
