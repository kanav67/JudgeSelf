package worker

import (
	"execution-engine/engine"
	"execution-engine/sandbox"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

type Worker struct {
	BoxID    int
	Sandbox  *sandbox.Sandbox
	LocalDir string
	Job      *engine.Job
}

const (
	LocalTemp       = "/tmp/execution-engine"
	CheckerBinFile  = "checkerBin"
	UserCodeBinFile = "userCodeBin"
	OutputDir       = "output"
)

func NewWorker(boxID int, job *engine.Job) (*Worker, error) {
	w := &Worker{
		BoxID:    boxID,
		LocalDir: filepath.Join(LocalTemp, job.SubmissionData.SubmissionID),
		Job:      job,
	}

	sandbox, err := sandbox.NewSandbox(boxID)
	if err != nil {
		//todo
		panic("Failed to initialize sandbox: " + err.Error())
	}
	w.Sandbox = sandbox

	err = os.MkdirAll(w.LocalDir, 0755)
	if err != nil {
		return nil, fmt.Errorf("Failed to create destination directory: %w", err)
	}

	return w, nil
}

func (w *Worker) ExecuteWorker() []engine.Result {
	checkerBin, compileResult := w.CompileCheckerCode()
	if checkerBin == nil {
		return []engine.Result{compileResult}
	}

	userCodeBin, compileResult := w.CompileUserCode()
	if userCodeBin == nil {
		return []engine.Result{compileResult}
	}

	results := make([]engine.Result, 0, w.Job.ProblemData.TestCount)

	for test := 1; test <= w.Job.ProblemData.TestCount; test++ {
		testInputPath := w.Job.ProblemData.GetTestFilePath(test)
		testAnswerPath := w.Job.ProblemData.GetAnswerFilePath(test)
		testOutputPath := w.GetOutputFilePath(test)

		userCodeResult := w.ExecuteUserCode(userCodeBin, testInputPath, testOutputPath)
		if userCodeResult.Status != "AC" {
			userCodeResult.Test = test
			results = append(results, userCodeResult)
			return results
		}

		checkerResult := w.ExecuteChecker(checkerBin, testInputPath, testOutputPath, testAnswerPath)

		if checkerResult.Status != "AC" && checkerResult.Status != "WA" {
			checkerResult.Test = test
			//avoid confusing user with unrealistic time and memory usage from checker
			checkerResult.Time = 0
			checkerResult.Memory = 0
			results = append(results, checkerResult)
			return results
		}

		answerSnippet, _ := sandbox.ReadSnippet(testAnswerPath)

		finalTestResult := engine.Result{
			Test:          test,
			Time:          userCodeResult.Time,
			Memory:        userCodeResult.Memory,
			Status:        checkerResult.Status,
			Message:       checkerResult.Message,
			InputSnippet:  userCodeResult.InputSnippet,
			OutputSnippet: userCodeResult.OutputSnippet,
			AnswerSnippet: answerSnippet,
		}
		results = append(results, finalTestResult)
	}

	return results
}

func (w *Worker) GetOutputDir() string {
	return filepath.Join(w.LocalDir, OutputDir)
}

func (w *Worker) GetOutputFileName(test int) string {
	length := len(strconv.Itoa(w.Job.ProblemData.TestCount))
	return fmt.Sprintf("%0*d.out", length, test)
}

func (w *Worker) GetOutputFilePath(test int) string {
	return filepath.Join(w.GetOutputDir(), w.GetOutputFileName(test))
}

func GetDefaultConfig() *sandbox.IsolateConfig {
	return sandbox.NewIsolateConfig(func(ic *sandbox.IsolateConfig) {
		ic.MemoryLimit = 2 * 1024 * 1024 // 2 GB
		ic.TimeLimit = 5.0               // 5 seconds
		ic.WallTimeLimit = 10.0          // 10 seconds
	})
}
