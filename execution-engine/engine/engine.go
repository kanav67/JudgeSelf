package engine

import (
	"execution-engine/config"
	"execution-engine/models"
	"fmt"
	"sync"
)

type Engine struct {
	Config          *config.Config
	DbClient        *PostgresClient
	S3Client        *S3Client
	Cache           *Cache
	RabbitMQClient  *RabbitMQConsumer
	ReddisPublisher *RedisPublisher

	JobQueue chan models.Job
	Wg       sync.WaitGroup
}

func NewEngine() (*Engine, error) {
	engine := &Engine{}

	cfg := config.Load()
	engine.Config = &cfg

	dbClient, err := NewPostgresClient(cfg.PostgresDSN)
	if err != nil {
		return nil, fmt.Errorf("Failed to create dbClient: %v", err)
	}
	engine.DbClient = dbClient

	s3Client, err := NewS3Client(cfg.S3BucketName, cfg.S3Region, cfg.S3Endpoint, cfg.S3ForcePathStyle)
	if err != nil {
		dbClient.Close()
		return nil, fmt.Errorf("Failed to create s3Client: %v", err)
	}
	engine.S3Client = s3Client

	cache := NewCache(engine.DbClient, engine.S3Client)
	engine.Cache = cache

	rabbitMQClient, err := NewRabbitMQConsumer(cfg.RabbitURL, cfg.RabbitQueue, cfg.WorkerCount)
	if err != nil {
		dbClient.Close()
		return nil, fmt.Errorf("Failed to create rabbitMQClient: %v", err)
	}
	engine.RabbitMQClient = rabbitMQClient

	redisPublisher, err := NewRedisPublisher(cfg.RedisAddr, cfg.StatusChannel)
	if err != nil {
		dbClient.Close()
		rabbitMQClient.Close()
		return nil, fmt.Errorf("Failed to create redisPublisher: %v", err)
	}
	engine.ReddisPublisher = redisPublisher

	return engine, nil
}