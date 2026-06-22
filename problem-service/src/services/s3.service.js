const { env } = require("../config/env");
const { s3Client } = require("../config/s3");
const { PutObjectCommand } = require('@aws-sdk/client-s3');

async function uploadToS3(localFilePath, s3Key) {
    const fileStream = createReadStream(localFilePath);
    
    const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: s3Key,
        Body: fileStream
    });

    await s3Client.send(command);
}

module.exports = { uploadToS3 };