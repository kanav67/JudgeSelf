import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/problem_service',
  pgPoolMax: Number(process.env.PGPOOL_MAX ?? 10),
  
  rabbitURL: process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672/",
  rabbitQueue: process.env.RABBITMQ_QUEUE ?? "verdicts",

  redisAddr: process.env.REDIS_ADDR ?? "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  redisDB: Number(process.env.REDIS_DB) ?? 0,
};