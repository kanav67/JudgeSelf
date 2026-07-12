package engine

import (
	"context"
	"encoding/json"
	"github.com/redis/go-redis/v9"
)

type StatusMessage struct {
	SubmissionID string `json:"submission_id"`
	ContestID    string `json:"contest_id"` //for ws in contest room
	Running      bool   `json:"running"`
	Time         int64  `json:"time"`
	Memory       int64  `json:"memory"`
	Status       string `json:"status"`
}

type RedisPublisher struct {
	client  *redis.Client
	channel string
}

func NewRedisPublisher(url, channel string) (*RedisPublisher, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opt)
	if err := client.Ping(context.Background()).Err(); err != nil {
		_ = client.Close()
		return nil, err
	}
	return &RedisPublisher{client: client, channel: channel}, nil
}

func (p *RedisPublisher) Close() error {
	return p.client.Close()
}

func (p *RedisPublisher) Publish(ctx context.Context, msg StatusMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return p.client.Publish(ctx, p.channel, data).Err()
}
