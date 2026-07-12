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
  polygonBaseUrl: process.env.POLYGON_BASE_URL ?? 'https://codeforces.com',
  isolateBinary: process.env.ISOLATE_BINARY ?? 'isolate',
  s3Endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'problem-service',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'problem-service-secret',
  s3Bucket: process.env.S3_BUCKET ?? 'problem-service-artifacts',
  s3ForcePathStyle: toBoolean(process.env.S3_FORCE_PATH_STYLE, true),
  polygonUsername: process.env.POLYGON_USERNAME ?? 'your_polygon_username',
  polygonPassword: process.env.POLYGON_PASSWORD ?? 'your_polygon_password',
  polygonTmpDir: process.env.POLYGON_TMPDIR ?? '/tmp/polygon/',
  polygonAllowGenerateTests: toBoolean(process.env.POLYGON_ALLOW_GENERATE_TESTS, false),
};