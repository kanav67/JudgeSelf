const { S3Client } = require('@aws-sdk/client-s3');

const { env } = require('./env');

const s3Config = {
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  forcePathStyle: env.s3ForcePathStyle,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
};

const s3Client = new S3Client(s3Config);

module.exports = {
  s3Client,
  s3Config,
};