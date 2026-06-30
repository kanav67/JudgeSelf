package worker

import (
	"context"
	"execution-engine/engine"
)

//workaround for cyclic dependency between engine and worker packages
func StartPool(ctx context.Context, e *engine.Engine) error {
	for i := 1; i <= e.Config.WorkerCount; i++ {
		worker, err := NewWorker(e, i)
		if err != nil {
			return err
		}
		
		e.Wg.Add(1)
		go worker.Start(ctx, e.JobQueue)
	}
	return nil
}