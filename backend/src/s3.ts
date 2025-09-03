import { S3Client } from '@aws-sdk/client-s3'

const config: any = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined
}

// Add custom endpoint for MinIO or other S3-compatible services
if (process.env.S3_ENDPOINT) {
  config.endpoint = process.env.S3_ENDPOINT
  config.forcePathStyle = true // Required for MinIO
}

export const s3 = new S3Client(config)
