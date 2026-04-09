import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

function getClient(): S3Client {
  const accountId = requireEnv("CLOUDFLARE_R2_ACCOUNT_ID")
  const accessKeyId = requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID")
  const secretAccessKey = requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function uploadBufferToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const bucket = requireEnv("CLOUDFLARE_R2_BUCKET_NAME")
  const client = getClient()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
}

export async function getGetUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const bucket = requireEnv("CLOUDFLARE_R2_BUCKET_NAME")
  const client = getClient()
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}
