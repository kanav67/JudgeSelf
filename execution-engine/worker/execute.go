package worker

import (
	"execution-engine/models"
	"execution-engine/sandbox"
	"log"
	"path/filepath"
)

// todo
func (w *Worker) ExecuteUserCode(userCodeBin []byte, testInputPath, testOutputPath string) models.Result {
	userCodeLanguage := w.Job.SubmissionData.SourceLanguage

	userCodeExecuteConfig := sandbox.NewIsolateConfig(func(ic *sandbox.IsolateConfig) {
		ic.TimeLimit = float64(w.Job.ProblemData.TimeLimit) / 1000
		ic.MemoryLimit = w.Job.ProblemData.MemoryLimit
		ic.WallTimeLimit = ic.TimeLimit * 2
	})

	result := w.Sandbox.ExecuteCode(userCodeBin, userCodeLanguage, testInputPath, testOutputPath, "", nil, userCodeExecuteConfig)

	if result.IsolateMetadata == nil {
		return FormatResult(result, "INT")
	}

	status, message := FormatIsolateMetadata(result.IsolateMetadata, false)
	if status == "INT" {
		result.Message = "Usercode Execution failed, (Internal error by sandbox) \n" + IsolateMetadataToString(result.IsolateMetadata)
		return FormatResult(result, "INT")
	}
	result.Message = message

	return FormatResult(result, status)
}

// todo
func (w *Worker) ExecuteChecker(checkerBin []byte, testInputPath, testOutputPath, testAnswerPath string) models.Result {
	checkerLanguage := w.Job.ProblemData.CheckerLanguage

	checkerExecuteConfig := GetDefaultConfig()

	inputMount, destInputPath := filePathToMount(testInputPath)
	outputMount, destOutputPath := filePathToMount(testOutputPath)
	answerMount, destAnswerPath := filePathToMount(testAnswerPath)
	checkerExecuteConfig.DirMounts = []sandbox.MountDir{inputMount, outputMount, answerMount}

	result := w.Sandbox.ExecuteCode(checkerBin, checkerLanguage, "", "", "", []string{destInputPath, destOutputPath, destAnswerPath}, checkerExecuteConfig)

	log.Printf("[Worker %d] Checker execution result: %+v", w.BoxID, result)

	if result.IsolateMetadata == nil {
		return FormatResult(result, "INT")
	}

	status, message := FormatIsolateMetadata(result.IsolateMetadata, true)
	if status == "INT" {
		result.Message = "Checker Execution failed, (Internal error by sandbox) \n" + IsolateMetadataToString(result.IsolateMetadata)
		return FormatResult(result, "INT")
	}
	result.Message = message

	if status != "AC" && status != "WA" {
		result.Message = "Checker Execution failed, (Checker returned unexpected status: " + status + ") \n" + IsolateMetadataToString(result.IsolateMetadata)
		return FormatResult(result, "FAIL")
	}

	log.Printf("[Worker %d] Checker verdict: %s, message: %s and isolate metadata: %v", w.BoxID, status, result.Message, result.IsolateMetadata)

	finalResult := FormatResult(result, status)
	finalResult.Message = result.Stderr

	return finalResult
}

func filePathToMount(path string) (sandbox.MountDir, string) {
	dir := filepath.Dir(path)
	dirname := filepath.Join("/", filepath.Base(dir))
	destFilePath := filepath.Join(dirname, filepath.Base(path))

	mount := sandbox.MountDir{
		Source:      dir,
		Destination: dirname,
		Writable:    false,
	}
	return mount, destFilePath
}
