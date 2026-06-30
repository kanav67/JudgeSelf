package engine

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
)

type Publisher struct {
	client *redis.Client
	channel string
}

func NewRedisPublisher(url, channel string) (*Publisher, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opt)
	if err := client.Ping(context.Background()).Err(); err != nil {
		_ = client.Close()
		return nil, err
	}
	return &Publisher{client: client, channel: channel}, nil
}

func (p *Publisher) Close() error {
	return p.client.Close()
}

func (p *Publisher) Publish(ctx context.Context, verdict Verdict) error {
	data, err := json.Marshal(verdict)
	if err != nil {
		return err
	}
	return p.client.Publish(ctx, p.channel, data).Err()
}
