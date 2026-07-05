import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value: any, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
};

export const env = {
  problemServiceUrl: process.env.PROBLEM_SERVICE_URL ?? 'http://problem-service:9000',
  jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET ?? 'default_access',
  jwtRefreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET ?? 'default_refresh',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/problem_service',
  pgPoolMax: Number(process.env.PGPOOL_MAX ?? 10),
  s3Endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'problem-service',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'problem-service-secret',
  s3Bucket: process.env.S3_BUCKET ?? 'problem-service-artifacts',
  s3ForcePathStyle: toBoolean(process.env.S3_FORCE_PATH_STYLE, true),
};