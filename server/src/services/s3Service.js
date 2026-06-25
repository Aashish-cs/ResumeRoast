const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const config = require("../config/env");

const isS3Configured = () =>
  Boolean(
    config.aws.accessKeyId &&
      config.aws.secretAccessKey &&
      config.aws.bucket &&
      config.aws.region
  );

let s3Client;
const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });
  }

  return s3Client;
};

const uploadResumeToS3 = async ({ userId, file }) => {
  if (!isS3Configured()) {
    console.log("[s3 skipped] AWS credentials or bucket are not configured.");
    return null;
  }

  const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, "_");
  const key = `resumes/${userId}/${Date.now()}-${safeName}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: "AES256"
    })
  );

  return key;
};

module.exports = {
  uploadResumeToS3
};
