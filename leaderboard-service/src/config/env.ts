import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8000),
  databaseUrl: process.env.POSTGRES_DSN ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  redisAddr: process.env.REDIS_ADDR ?? "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  redisDB: Number(process.env.REDIS_DB) ?? 0,

  rabbitURL: process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672/",
  rabbitQueue: process.env.RABBITMQ_QUEUE_VERDICTS ?? "verdicts",
  penaltyOffset: 10000000, //used to compute composite score
};