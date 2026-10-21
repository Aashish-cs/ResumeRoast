const { randomUUID } = require("crypto");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const config = require("../config/env");
const AppError = require("../utils/AppError");
let client;
function getClient() {
  if (!config.aws.bucket)
    throw new AppError(
      "Resume storage is not configured.",
      503,
      "STORAGE_UNAVAILABLE",
    );
  return (client ||= new S3Client({
    region: config.aws.region,
    ...(config.aws.endpoint ? {endpoint: config.aws.endpoint, forcePathStyle: true} : {}),
    ...(config.aws.accessKeyId
      ? {
          credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
            sessionToken: config.aws.sessionToken,
          },
        }
      : {}),
  }));
}
const uploadResumeToS3 = async ({ userId, file }) => {
  const key = `resumes/${userId}/${randomUUID()}.pdf`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
    }),
    { abortSignal: AbortSignal.timeout(15000) },
  );
  return key;
};
const readResume = async (key) => {
  const result = await getClient().send(
    new GetObjectCommand({ Bucket: config.aws.bucket, Key: key }),
    { abortSignal: AbortSignal.timeout(15000) },
  );
  if (result.ContentLength > config.resumeMaxBytes)
    throw new Error("Stored PDF exceeds size limit");
  return Buffer.from(await result.Body.transformToByteArray());
};
const deleteResume = (key) =>
  getClient().send(
    new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: key }),
    { abortSignal: AbortSignal.timeout(15000) },
  );
module.exports = { uploadResumeToS3, readResume, deleteResume };
