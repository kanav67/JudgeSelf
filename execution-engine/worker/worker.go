package worker

import (
	"context"
	"execution-engine/engine"
	"execution-engine/sandbox"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
)

type Worker struct {
	Engine  *engine.Engine
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

func NewWorker(engine *engine.Engine, boxID int) (*Worker, error) {
	w := &Worker{
		Engine:  engine,
		BoxID:    boxID,
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

func (w *Worker) CleanUp() {
	w.Sandbox.Cleanup()
}

func (w *Worker) Start(ctx context.Context, jobQueue <-chan engine.Job) {
	defer w.Engine.Wg.Done()
	
	log.Printf("[Worker %d] Online and waiting for jobs...", w.BoxID)
	for {
		select {
		case <-ctx.Done():
			log.Printf("[Worker %d] Shutting down...", w.BoxID)
			return
			
		case job, ok := <-jobQueue:
			if !ok {
				return //Channel closed
			}			
			err := w.RunWorker(ctx, job)
			
			if err != nil {
				log.Printf("[Worker %d] Error processing %s: %v", w.BoxID, job.SubmissionData.SubmissionID, err)
				_ = job.Nack(false) 
			} else {
				log.Printf("[Worker %d] Successfully finished %s", w.BoxID, job.SubmissionData.SubmissionID)
				_ = job.Ack()
			}
		}
	}
}

func (w *Worker) RunWorker(ctx context.Context, job *engine.Job) error {
	w.LocalDir = filepath.Join(LocalTemp, job.SubmissionData.SubmissionID)
	w.Job = job

	w.Sandbox.ReInitialize()

	results := []engine.Result{}

	//errors relating to downloading problem data
	err := w.PreExecute(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "PreExecute failed on worker %d while executing job %s: %v", w.BoxID, w.Job.SubmissionData.SubmissionID, err)
		return err
	}

	//if some error occurs treat it as internal error
	results = w.ExecuteWorker()

	//errors relating to saving to db
	err = w.PostExecute(ctx, results)
	if err != nil {
		fmt.Fprintf(os.Stderr, "PostExecute failed on worker %d while executing job %s: %v", w.BoxID, w.Job.SubmissionData.SubmissionID, err)
		return err
	}

	return nil
}

func (w *Worker) PreExecute(ctx context.Context) error {
	problemData, err := w.Engine.Cache.GetOrLoad(ctx, w.Job.SubmissionData.ProblemID)
	if err != nil {
		return fmt.Errorf("Failed to get or load problem data: %v", err)
	}
	w.Job.ProblemData = &problemData

	return nil
}

func (w *Worker) PostExecute(ctx context.Context, results []engine.Result) error {
	status := results[len(results)-1].Status
	maxTime := int64(0)
	maxMemory := int64(0)
	for _, result := range results {
		if int64(result.Time) > maxTime {
			maxTime = int64(result.Time)
		}
		if int64(result.Memory) > maxMemory {
			maxMemory = int64(result.Memory)
		}
	}
	w.Job.Verdict = &engine.Verdict{
		SubmissionID: w.Job.SubmissionData.SubmissionID,
		Status:       status,
		Time:         maxTime,
		Memory:       maxMemory,
		Results:      results,
	}

	w.Engine.DbClient.UpdateSubmission(ctx, *w.Job.Verdict)

	return nil
}

//todo use ctx
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

	if w.Job.ProblemData.TestCount == 0 {
		results = append(results, engine.Result{
			Test:    0,
			Time:    0,
			Memory:  0,
			Status:  "INT",
			Message: "No test cases found for this problem.",
		})
		return results
	}

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
