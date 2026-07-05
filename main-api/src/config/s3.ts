import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3Client = new S3Client({
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
  forcePathStyle: env.s3ForcePathStyle,
});

export const checkHealth = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.s3Bucket }));
    return { status: 'up' };
  } catch (error) {
    throw error;
  }
};