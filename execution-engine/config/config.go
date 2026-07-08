package config

import (
	"fmt"
	"os"
	"runtime"
	"strconv"
	"time"
)

type Config struct {
	S3Endpoint       string
	S3BucketName     string
	S3Region         string
	S3ForcePathStyle bool

	WorkerCount int

	PostgresDSN string

	RabbitURL            string
	RabbitQueue          string
	RabbitPublisherQueue string

	RedisAddr     string
	RedisPassword string
	RedisDB       int
	StatusChannel string

	CacheDir        string
	ProblemCacheTTL time.Duration
}

func Load() Config {
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" {
		os.Setenv("AWS_ACCESS_KEY_ID", "problem-service")
	}
	if os.Getenv("AWS_SECRET_ACCESS_KEY") == "" {
		os.Setenv("AWS_SECRET_ACCESS_KEY", "problem-service-secret")
	}

	return Config{
		S3Endpoint:           env("S3_ENDPOINT", "http://localhost:9000"),
		S3BucketName:         env("S3_BUCKET_NAME", "problem-service-artifacts"),
		S3Region:             env("S3_REGION", "us-east-1"),
		S3ForcePathStyle:     boolEnv("S3_FORCE_PATH_STYLE", true),
		WorkerCount:          intEnv("WORKER_COUNT", runtime.NumCPU()),
		PostgresDSN:          env("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"),
		RabbitURL:            env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RabbitQueue:          env("RABBITMQ_QUEUE", "submissions"),
		RabbitPublisherQueue: env("RABBITMQ_PUBLISHER_QUEUE", "verdicts"),
		RedisAddr:            env("REDIS_ADDR", "redis://localhost:6379"),
		RedisPassword:        env("REDIS_PASSWORD", ""),
		RedisDB:              intEnv("REDIS_DB", 0),
		CacheDir:             env("CACHE_DIR", "/tmp/execution-engine/"),
		ProblemCacheTTL:      durationEnv("PROBLEM_CACHE_TTL", 5*time.Minute),
		StatusChannel:        env("REDIS_STATUS_CHANNEL", "ws_updates"),
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func boolEnv(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err == nil {
			return parsed
		}
		fmt.Fprintf(os.Stderr, "Failed to parse env %s: %v\n", key, err)
	}
	return fallback
}

func intEnv(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
		fmt.Fprintf(os.Stderr, "Failed to parse env %s: %v\n", key, err)
	}
	return fallback
}

func durationEnv(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		parsed, err := time.ParseDuration(value)
		if err == nil {
			return parsed
		}
		fmt.Fprintf(os.Stderr, "Failed to parse env %s: %v\n", key, err)
	}
	return fallback
}
