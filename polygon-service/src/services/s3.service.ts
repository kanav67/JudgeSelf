import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { readFile, stat } from "fs/promises";

export const uploadToS3 = async (filePath: string, key: string) => {
  //some weird issue on wsl when using createReadStream
  const fileStream = await readFile(filePath);// 
  await s3Client.send(new PutObjectCommand({ 
    Bucket: env.s3Bucket, 
    Key: key, 
    Body: fileStream
  }));
};