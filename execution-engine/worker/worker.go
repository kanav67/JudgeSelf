package worker

import (
	"context"
	"execution-engine/engine"
	"execution-engine/models"
	"execution-engine/sandbox"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type Worker struct {
	Engine   *engine.Engine
	BoxID    int
	Sandbox  *sandbox.Sandbox
	LocalDir string
	Job      *models.Job
}

const (
	LocalTemp       = "/tmp/execution-engine"
	CheckerBinFile  = "checkerBin"
	UserCodeBinFile = "userCodeBin"
	OutputDir       = "output"
)

func NewWorker(engine *engine.Engine, boxID int) (*Worker, error) {
	w := &Worker{
		Engine: engine,
		BoxID:  boxID,
	}

	sandbox, err := sandbox.NewSandbox(boxID)
	if err != nil {
		//todo
		panic("Failed to initialize sandbox: " + err.Error())
	}
	w.Sandbox = sandbox

	return w, nil
}

func (w *Worker) CleanUp() {
	w.Sandbox.Cleanup()
}

func (w *Worker) Start(ctx context.Context, jobQueue <-chan models.Job) {
	defer w.Engine.Wg.Done()

	log.Printf("[Worker %d] Online and waiting for jobs...", w.BoxID)
	for {
		select {
		case <-ctx.Done():
			log.Printf("[Worker %d] Shutting down...", w.BoxID)
			return

		case job, ok := <-jobQueue:
			if !ok {
				log.Printf("[Worker %d] Job queue closed", w.BoxID)
				return //Channel closed
			}
			log.Printf("[Worker %d] Received job: %s", w.BoxID, job.SubmissionData.SubmissionID)

			err := w.RunWorker(ctx, &job)

			if err != nil {
				log.Printf("[Worker %d] Error processing %s: %v", w.BoxID, job.SubmissionData.SubmissionID, err)
				_ = job.Nack(false)
			} else {
				log.Printf("[Worker %d] Successfully finished: %s", w.BoxID, job.SubmissionData.SubmissionID)
				_ = job.Ack()
			}

			log.Printf("[Worker %d] Job verdict: %+v", w.BoxID, []interface{}{job.Verdict.Memory, job.Verdict.Time, job.Verdict.Status, job.Verdict.Results[len(job.Verdict.Results)-1].Message})
		}
	}
}

func (w *Worker) RunWorker(ctx context.Context, job *models.Job) error {
	w.LocalDir = filepath.Join(LocalTemp, job.SubmissionData.SubmissionID)
	err := os.MkdirAll(w.LocalDir, 0755)
	if err != nil {
		return fmt.Errorf("Failed to create localDir directory: %w", err)
	}

	w.Job = job

	w.Sandbox.ReInitialize()

	results := []models.Result{}

	//errors relating to downloading problem data
	err = w.PreExecute(ctx)
	if err != nil {
		log.Printf("[Worker %d] PreExecute failed while executing job %s: %v", w.BoxID, w.Job.SubmissionData.SubmissionID, err)
		return err
	}

	//if some error occurs treat it as internal error
	results = w.ExecuteWorker()

	//errors relating to saving to db
	err = w.PostExecute(ctx, results)
	if err != nil {
		log.Printf("[Worker %d] PostExecute failed while executing job %s: %v", w.BoxID, w.Job.SubmissionData.SubmissionID, err)
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

func (w *Worker) PostExecute(ctx context.Context, results []models.Result) error {
	status := results[len(results)-1].Status
	maxTime := int64(0)
	maxMemory := int64(0)
	for _, result := range results {
		if int64(result.Time*1000) > maxTime {
			maxTime = int64(result.Time * 1000)
		}
		if int64(result.Memory) > maxMemory {
			maxMemory = int64(result.Memory)
		}
	}
	w.Job.Verdict = &models.Verdict{
		SubmissionID: w.Job.SubmissionData.SubmissionID,
		Status:       status,
		Time:         maxTime,
		Memory:       maxMemory,
		Results:      results,
	}

	err := w.Engine.DbClient.UpdateSubmission(ctx, *w.Job.Verdict)
	if err != nil {
		return fmt.Errorf("Failed to update submission in database: %v", err)
	}

	if w.Job.SubmissionData.Type == "RATED" {
		//we don't care about the error here, if it fails leaderboard should auto regenerate
		_ = w.Engine.RabbitMQPublisher.PublishSubmissionResult(ctx, engine.QueueMessage{
			SubmissionID:           w.Job.SubmissionData.SubmissionID,
			UserId:                 w.Job.SubmissionData.UserID,
			RelativeSubmissionTime: w.Job.SubmissionData.RelativeSubmissionTime,
			Status:                 status,
			ContestID:              w.Job.ProblemData.ContestID,
			ProblemId:              w.Job.ProblemData.ProblemID,
		})
	}

	return nil
}

// todo use ctx
func (w *Worker) ExecuteWorker() []models.Result {
	checkerBin, compileResult := w.CompileCheckerCode()
	if checkerBin == nil {
		return []models.Result{compileResult}
	}

	userCodeBin, compileResult := w.CompileUserCode()
	if userCodeBin == nil {
		return []models.Result{compileResult}
	}

	results := make([]models.Result, 0, w.Job.ProblemData.TestCount)

	if w.Job.ProblemData.TestCount == 0 {
		results = append(results, models.Result{
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

		internal_userCodeExecuteTime := time.Now()
		userCodeResult := w.ExecuteUserCode(userCodeBin, testInputPath, testOutputPath)
		log.Printf("[Worker %d] Internal User code execution time for test %d: %v", w.BoxID, test, time.Since(internal_userCodeExecuteTime))

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

		finalTestResult := models.Result{
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

		if checkerResult.Status == "WA" {
			return results
		}
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
	//turns out compilation is memory hungry and can take some time
	return sandbox.NewIsolateConfig(func(ic *sandbox.IsolateConfig) {
		ic.MemoryLimit = 2 * 1024 * 1024 // 2 GB
		ic.TimeLimit = 30.0               // 30 seconds
		ic.WallTimeLimit = 31.0          // 31 seconds
	})
}
