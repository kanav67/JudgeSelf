package engine

import (
	"context"
	"encoding/json"
	"execution-engine/models"

	"github.com/redis/go-redis/v9"
)

type RedisPublisher struct {
	client *redis.Client
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

func (p *RedisPublisher) Publish(ctx context.Context, verdict models.Verdict) error {
	data, err := json.Marshal(verdict)
	if err != nil {
		return err
	}
	return p.client.Publish(ctx, p.channel, data).Err()
}
