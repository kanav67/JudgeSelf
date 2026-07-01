package engine

import (
	"context"
	"execution-engine/models"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Envelope struct {
	Job      models.Job
	Delivery amqp.Delivery
}

type RabbitMQConsumer struct {
	conn  *amqp.Connection
	ch    *amqp.Channel
	queue string
}

func NewRabbitMQConsumer(url, queue string, prefetch int) (*RabbitMQConsumer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, err
	}
	if err := ch.Qos(prefetch, 0, false); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}
	if _, err := ch.QueueDeclare(queue, true, false, false, false, nil); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}
	return &RabbitMQConsumer{conn: conn, ch: ch, queue: queue}, nil
}

func (c *RabbitMQConsumer) Close() {
	if c.ch != nil {
		_ = c.ch.Close()
	}
	if c.conn != nil {
		_ = c.conn.Close()
	}
}

func (c *RabbitMQConsumer) Consume(ctx context.Context, jobQueue chan<- models.Job) error {
	deliveries, err := c.ch.Consume(c.queue, "", false, false, false, false, nil)
	if err != nil {
		return err
	}
	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping RabbitMQ consumer")
			return ctx.Err()
		case delivery, ok := <-deliveries:
			if !ok {
				log.Println("Delivery channel closed")
				return nil
			}

			log.Printf("Received delivery: %s", string(delivery.Body))

			job, err := decode(delivery.Body)
			if err != nil {
				log.Printf("Failed to parse job payload: %v", err)
				_ = delivery.Nack(false, false)
				continue
			}

			log.Printf("Parsed job: %+v", job)

			job.Ack = func() error {
				return delivery.Ack(false)
			}
			job.Nack = func(requeue bool) error {
				return delivery.Nack(false, requeue)
			}

			jobQueue <- job
		}
	}
}

func decode(body []byte) (models.Job, error) {
	data, err := models.ParseSubmissionData(body)
	if err != nil {
		return models.Job{}, err
	}
	return models.Job{SubmissionData: &data}, nil
}
