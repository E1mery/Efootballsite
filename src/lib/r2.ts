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
 * Includes automatic retry with backoff to prevent data loss during transient network issues.
 */
export async function uploadBufferToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
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
    } catch (err: any) {
      lastError = err;
      console.warn(`[Cloudflare R2] Upload attempt ${attempt + 1} failed for key ${key}:`, err?.message);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(`Failed to upload file to Cloudflare storage after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`);
}

/**
 * Uploads a base64 encoded data URI (e.g. data:image/png;base64,...) or raw base64 string to Cloudflare R2.
 */
export async function uploadBase64ToR2(
  dataUri: string,
  folder: string = "screenshots"
): Promise<string> {
  if (!dataUri) {
    throw new Error("Invalid base64 image data: empty input.");
  }

  // If it's already a URL (e.g. starts with http or /api/files), return as-is
  if (dataUri.startsWith("http://") || dataUri.startsWith("https://") || dataUri.startsWith("/api/files/")) {
    return dataUri;
  }

  // Handle data URI format or raw base64
  let contentType = "image/png";
  let base64Data = dataUri;

  if (dataUri.startsWith("data:")) {
    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid image format or encoding.");
    }
    contentType = match[1].toLowerCase();
    base64Data = match[2];
  }

  const buffer = Buffer.from(base64Data, "base64");

  // Determine file extension accurately
  let extension = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
  else if (contentType.includes("webp")) extension = "webp";
  else if (contentType.includes("gif")) extension = "gif";
  else if (contentType.includes("svg")) extension = "svg";
  else if (contentType.includes("heic")) extension = "heic";
  else if (contentType.includes("heif")) extension = "heif";
  else if (contentType.includes("avif")) extension = "avif";
  else if (contentType.includes("bmp")) extension = "bmp";

  const fileId = crypto.randomUUID();
  const key = `uploads/${folder}/${Date.now()}-${fileId}.${extension}`;

  return await uploadBufferToR2(buffer, key, contentType);
}

/**
 * Ensures a file string (URL or base64 data) is permanently stored in Cloudflare R2 storage.
 * If already a Cloudflare or external URL, returns it directly.
 * If base64, uploads immediately to Cloudflare R2 and returns the persistent URL.
 * Guarantees no base64 payloads pollute the database.
 */
export async function ensureR2FileUrl(
  input: string | null | undefined,
  folder: string = "uploads"
): Promise<string> {
  if (!input || !input.trim()) return "";
  const trimmed = input.trim();

  // Already uploaded / stored in Cloudflare storage or external CDN
  if (
    trimmed.startsWith("/api/files/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  // Base64 data URI or raw base64: upload to Cloudflare storage
  if (trimmed.startsWith("data:") || trimmed.length > 200) {
    return await uploadBase64ToR2(trimmed, folder);
  }

  return trimmed;
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
