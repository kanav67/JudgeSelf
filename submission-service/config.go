package main

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	PostgresDSN string

	RabbitURL   string
	RabbitQueue string

	RedisAddr     string
	RedisPassword string
	RedisDB       int
	StatusChannel   string

	JwtSecret string
}

func LoadConfig() Config {
	return Config{
		PostgresDSN:      env("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"),
		RabbitURL:        env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RabbitQueue:      env("RABBITMQ_QUEUE", "submissions"),
		RedisAddr:        env("REDIS_ADDR", "redis://localhost:6379"),
		RedisPassword:    env("REDIS_PASSWORD", ""),
		RedisDB:          intEnv("REDIS_DB", 0),
		StatusChannel:    env("REDIS_STATUS_CHANNEL", "ws_updates"),
		JwtSecret:        env("JWT_SECRET", "your-super-secret-key"),
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
