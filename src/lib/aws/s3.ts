import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './config';

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string = 'video/mp4' // default to video/mp4
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: contentType,
    // ACL: 'public-read', // optional: makes it accessible via URL
  });

  await s3Client.send(command);

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}

export async function getReelUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}