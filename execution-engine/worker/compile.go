package worker

import (
	"context"
	"execution-engine/models"
	"log"
	"os"
)

func (w *Worker) CompileCheckerCode() ([]byte, models.Result) {
	cacheItem, _ := w.Engine.Cache.S3Cache.GetOrLoad(context.Background(), *w.Job.ProblemData)
	cacheItem.Mu.RLock()
	cachedCheckerBin := cacheItem.CompiledBin
	cacheItem.Mu.RUnlock()

	if cachedCheckerBin != nil {
		return cachedCheckerBin, models.Result{}
	}
	
	cacheItem.Mu.Lock()
	if cacheItem.CompiledBin != nil {
		cacheItem.Mu.Unlock()
		return cacheItem.CompiledBin, models.Result{}
	}

	checkerLanguage := w.Job.ProblemData.CheckerLanguage
	checkerSource, _ := os.ReadFile(w.Job.ProblemData.GetCheckerSourcePath())

	log.Printf("[Worker %d] Compiling checker code", w.BoxID)

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

	log.Printf("[Worker %d] Checker code compiled successfully", w.BoxID)

	cacheItem.CompiledBin = checkerBin
	cacheItem.Mu.Unlock()

	return checkerBin, models.Result{}
}

func (w *Worker) CompileUserCode() ([]byte, models.Result) {
	userCodeSource := []byte(w.Job.SubmissionData.SourceCode)
	userCodeLanguage := w.Job.SubmissionData.SourceLanguage

	log.Printf("[Worker %d] Compiling user code", w.BoxID)

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

	log.Printf("[Worker %d] User code compiled successfully", w.BoxID)

	return userCodeBin, models.Result{}
}
