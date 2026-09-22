import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { uploadBufferToR2 } from "@/lib/r2";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderRaw = (formData.get("folder") as string) || "screenshots";
    const folder = folderRaw.replace(/[^a-zA-Z0-9_-]/g, "");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No valid file uploaded." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, WEBP, and GIF images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 15MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extension from mime or filename
    let extension = file.name.split(".").pop()?.toLowerCase() || "png";
    if (!["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
      extension = file.type.split("/")[1] || "png";
    }

    const fileId = crypto.randomUUID();
    const key = `uploads/${folder}/${Date.now()}-${fileId}.${extension}`;

    const url = await uploadBufferToR2(buffer, key, file.type);

    return NextResponse.json({
      success: true,
      url,
      key,
      size: file.size,
      contentType: file.type,
    });
  } catch (error: any) {
    console.error("R2 file upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file to Cloudflare R2." },
      { status: 500 }
    );
  }
}
