package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQPublisher struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	queue   string
}

func InitRabbitMQ(url, queueName string) (*RabbitMQPublisher, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	err = ch.Confirm(false)
	if err != nil {
		return nil, err
	}

	// Ensure the queue exists
	_, err = ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		return nil, err
	}

	return &RabbitMQPublisher{
		conn:    conn,
		channel: ch,
		queue:   queueName,
	}, nil
}

//this handles upto 500-1000 msgs/sec which is enough for our use case
//incase more throughput is needed you may use async publishing tho scaling would be a better choice in that case
func (p *RabbitMQPublisher) PublishSubmission(msg QueueMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	if p.channel.IsClosed() {
		return fmt.Errorf("Channel is closed")
	}

	confirm, err := p.channel.PublishWithDeferredConfirmWithContext(context.Background(),
		"",      // exchange
		p.queue, // routing key
		false,   // mandatory
		false,   // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	acked, err := confirm.WaitContext(ctx)
	cancel()

	if err != nil {
		return fmt.Errorf("Confirmation wait failed: %v", err)
	}
	if !acked {
		return fmt.Errorf("Message %d was nacked by the broker", confirm.DeliveryTag)
	}

	return nil
}

func (p *RabbitMQPublisher) Close() {
	p.channel.Close()
	p.conn.Close()
}
