package worker

import (
	"execution-engine/job"
	"execution-engine/sandbox"
	"os"
)

//todo
func (w *Worker) ExecuteUserCode(userCodeBin []byte, testInputPath, testOutputPath string) (job.Result) {
	userCodeLanguage := w.Job.SubmissionData.SourceLanguage

	userCodeExecuteConfig := sandbox.NewIsolateConfig(func(ic *sandbox.IsolateConfig) {
		ic.TimeLimit = float64(w.Job.ProblemData.TimeLimit) / 1000
		ic.MemoryLimit = w.Job.ProblemData.MemoryLimit
		ic.WallTimeLimit = ic.TimeLimit * 2
	})


	result := w.Sandbox.ExecuteCode(userCodeBin, userCodeLanguage, testInputPath, testOutputPath, "", nil, userCodeExecuteConfig)
	if result.IsolateMetadata == nil {
		return FormatError(result, "INT")
	}
	status, message := FormatIsolateMetadata(result.IsolateMetadata, false)
	if(status == "INT"){
		result.Message = "Usercode Compilation failed, (Internal error by sandbox) \n" + IsolateMetadataToString(result.IsolateMetadata)
		return FormatError(result, "INT")
	}
	if(status == "AC"){
		result.Message = "Usercode Compilation failed, (Code compiled successfully but no bin was generated) \n" + IsolateMetadataToString(result.IsolateMetadata)
		return FormatError(result, "INT")
	}
	result.Message = message

	return FormatError(result, "CE")

	return job.Result{}
}


//todo
func (w *Worker) ExecuteChecker(checkerBin []byte, testInputPath, testOutputPath, testAnswerPath string) (job.Result) {
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

		return FormatError(result, "INT")
	}

	return job.Result{}
}
