const { stat } = require("fs/promises");
const { env } = require("../config/env");
const { s3Client } = require("../config/s3");
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { createReadStream } = require('fs');

async function uploadToS3(localFilePath, s3Key) {
    const fileStats = await stat(localFilePath);
    const fileStream = createReadStream(localFilePath);
    
    const command = new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: s3Key,
        Body: fileStream,
        ContentLength: fileStats.size
    });

    await s3Client.send(command);
}

module.exports = { uploadToS3 };