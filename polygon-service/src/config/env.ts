import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value: any, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: process.env.POSTGRES_DSN ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  pgPoolMax: Number(process.env.PGPOOL_MAX ?? 10),

  redisAddr: process.env.REDIS_ADDR ?? "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  redisDB: Number(process.env.REDIS_DB) ?? 0,
  redisStatusChannel: process.env.REDIS_STATUS_CHANNEL ?? "status_updates",
  
  s3Endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'problem-service',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'problem-service-secret',
  s3Bucket: process.env.S3_BUCKET ?? 'problem-service-artifacts',
  s3ForcePathStyle: toBoolean(process.env.S3_FORCE_PATH_STYLE, true),

  polygonBaseUrl: process.env.POLYGON_BASE_URL ?? 'https://codeforces.com',
  polygonUsername: process.env.POLYGON_USERNAME ?? 'your_polygon_username',
  polygonPassword: process.env.POLYGON_PASSWORD ?? 'your_polygon_password',
  polygonTmpDir: process.env.POLYGON_TMPDIR ?? '/tmp/polygon/',
  polygonAllowGenerateTests: toBoolean(process.env.POLYGON_ALLOW_GENERATE_TESTS, false),
};