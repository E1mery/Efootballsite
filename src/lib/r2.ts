import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const R2_ACCOUNT_ENDPOINT = process.env.R2_ENDPOINT || "https://4da093e261818c95193bba5f1df93b43.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "7799cc26863683816f3af6ab0fd824e2";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "7f5bd9b8cee3cbef5dbe7dc878b202584473c6306795aa352e3f589b712699fe";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rwandafootballleague";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a raw buffer to Cloudflare R2 and returns a publicly accessible URL.
 */
export async function uploadBufferToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // If a custom domain or R2 public dev URL is set, use it; otherwise use the built-in streaming endpoint
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `/api/files/${key}`;
}

/**
 * Uploads a base64 encoded data URI (e.g. data:image/png;base64,...) or raw base64 string to Cloudflare R2.
 */
export async function uploadBase64ToR2(
  dataUri: string,
  folder: string = "screenshots"
): Promise<string> {
  if (!dataUri || !dataUri.startsWith("data:")) {
    // If it's already a URL (e.g. starts with http or /api/files), return as-is
    if (dataUri && (dataUri.startsWith("http") || dataUri.startsWith("/api/files"))) {
      return dataUri;
    }
    throw new Error("Invalid base64 image data URI.");
  }

  const match = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format or encoding.");
  }

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Determine file extension
  let extension = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
  else if (contentType.includes("webp")) extension = "webp";
  else if (contentType.includes("gif")) extension = "gif";
  else if (contentType.includes("svg")) extension = "svg";

  const fileId = crypto.randomUUID();
  const key = `uploads/${folder}/${Date.now()}-${fileId}.${extension}`;

  return await uploadBufferToR2(buffer, key, contentType);
}

/**
 * Retrieves an object from Cloudflare R2.
 */
export async function getObjectFromR2(key: string) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await r2Client.send(command);
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await r2Client.send(command);
}
