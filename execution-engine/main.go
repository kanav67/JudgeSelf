package main

import (
	"context"
	"execution-engine/engine"
	"execution-engine/worker"
	"log"
	"os/signal"
	"syscall"
)

//todo make it overall better
func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	engine, err := engine.NewEngine()
	if err != nil {
		panic("Failed to initialize execution engine: " + err.Error())
	}

	err = worker.StartPool(ctx, engine)
	if err != nil {
		panic("Failed to start worker pool: " + err.Error())
	}

	go func() {
		if err := engine.RabbitMQClient.Consume(ctx, engine.JobQueue); err != nil {
			log.Printf("RabbitMQ Consumer error: %v", err)
			cancel()
		}
	}()

	<-ctx.Done()
	log.Println("Initiating graceful shutdown...")

	// Close the job queue so workers know no more jobs are coming
	close(engine.JobQueue)

	// Wait for workers to finish their current executions
	engine.Wg.Wait()

	log.Println("Engine shutdown complete.")
}
