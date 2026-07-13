import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value: any, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8005),

  databaseUrl: process.env.POSTGRES_DSN ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  pgPoolMax: Number(process.env.PGPOOL_MAX ?? 10),

  redisAddr: process.env.REDIS_ADDR ?? "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  redisDB: Number(process.env.REDIS_DB) ?? 0,
  redisStatusChannel: process.env.REDIS_STATUS_CHANNEL ?? "status_updates",
};