package engine

type Engine struct {
	S3Client       *S3Client
	DbClient       *PostgresClient
	Cache          *Cache
	RabbitMQClient *RabbitMQClient
}
