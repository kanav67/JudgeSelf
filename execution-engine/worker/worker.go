package worker

import (
	job "execution-engine/job"
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
	Job      *job.Job
}

const (
	StdinFile       = "stdin.txt"
	StdoutFile      = "stdout.txt"
	StderrFile      = "stderr.txt"
	MetadataFile    = "metadata.txt"
	LocalTemp       = "/tmp/execution-engine"
	CheckerBinFile  = "checkerBin"
	UserCodeBinFile = "userCodeBin"
	OutputDir       = "output"
)

func NewWorker(boxID int, job *job.Job) (*Worker, error) {
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

func (w *Worker) ExecuteWorker() []job.Result {
	checkerLanguage := w.Job.ProblemData.CheckerLanguage
	checkerBin, compileResult := w.CompileCheckerCode()
	if checkerBin == nil {
		return []job.Result{compileResult}
	}

	userCodeLanguage := w.Job.SubmissionData.SourceLanguage
	userCodeBin, compileResult := w.CompileUserCode()
	if userCodeBin == nil {
		return []job.Result{compileResult}
	}

	userCodeExecuteConfig := sandbox.NewIsolateConfig(func(ic *sandbox.IsolateConfig) {
		ic.TimeLimit = float64(w.Job.ProblemData.TimeLimit) / 1000
		ic.MemoryLimit = w.Job.ProblemData.MemoryLimit
		ic.WallTimeLimit = ic.TimeLimit * 2
	})

	// results := make([]job.Result, 0, w.Job.ProblemData.TestCount)

	for test := 1; test <= w.Job.ProblemData.TestCount; test++ {
		testInputPath := w.Job.ProblemData.GetTestFilePath(test)
		testAnswerPath := w.Job.ProblemData.GetAnswerFilePath(test)
		testOutputPath := w.GetOutputFilePath(test)

		// userMeta :=
		w.Sandbox.ExecuteCode(userCodeBin, userCodeLanguage, testInputPath, testOutputPath, nil, userCodeExecuteConfig)
		// checkerMeta :=
		w.Sandbox.ExecuteCode(checkerBin, checkerLanguage, "", "", []string{testInputPath, testOutputPath, testAnswerPath}, userCodeExecuteConfig)
	}

	return nil
}

func (w *Worker) GetOutputDir() string {
	return filepath.Join(w.LocalDir, OutputDir)
}

func (w *Worker) GetOutputFilePath(test int) string {
	length := len(strconv.Itoa(w.Job.ProblemData.TestCount))
	return filepath.Join(w.GetOutputDir(), fmt.Sprintf("%0*d.out", length, test))
}

func GetDefaultConfig() *sandbox.IsolateConfig {
	return sandbox.NewIsolateConfig(func(ic *sandbox.IsolateConfig) {
		ic.MemoryLimit = 2 * 1024 * 1024 // 2 GB
		ic.TimeLimit = 5.0               // 5 seconds
		ic.WallTimeLimit = 10.0          // 10 seconds
	})
}
