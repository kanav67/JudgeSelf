package engine

import (
	"context"
	"encoding/json"
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQPublisher struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	queue   string
}

type QueueMessage struct {
	SubmissionID           string `json:"submission_id"`
	Status                 string `json:"status"`
	UserId                 string `json:"user_id"`
	ContestID              string `json:"contest_id"`
	ProblemId              string `json:"problem_id"`
	RelativeSubmissionTime int64  `json:"relative_submission_time"`
}

func NewRabbitMQPublisher(url, queueName string) (*RabbitMQPublisher, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}
	_, err = ch.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		conn.Close()
		ch.Close()
		return nil, err
	}

	return &RabbitMQPublisher{
		conn:    conn,
		channel: ch,
		queue:   queueName,
	}, nil
}

// we don't need it to be guaranteed
func (p *RabbitMQPublisher) PublishSubmissionResult(ctx context.Context, msg QueueMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	if p.channel.IsClosed() {
		return fmt.Errorf("Channel is closed")
	}

	err = p.channel.PublishWithContext(ctx,
		"",      // exchange
		p.queue, // routing key
		false,   // mandatory
		false,   // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		})

	if err != nil {
		return fmt.Errorf("Confirmation wait failed: %v", err)
	}

	return nil
}

func (p *RabbitMQPublisher) Close() {
	p.channel.Close()
	p.conn.Close()
}
