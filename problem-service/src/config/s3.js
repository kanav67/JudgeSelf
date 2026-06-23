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

const checkHealth = async () => {
  try {
    await s3Client.send(new (require('@aws-sdk/client-s3')).HeadBucketCommand({ Bucket: env.s3Bucket }));
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
};

module.exports = {
  s3Client,
  s3Config,
  checkHealth,
};