import { NextResponse } from "next/server";
import { getObjectFromR2 } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    if (!key || key.length === 0) {
      return NextResponse.json({ error: "File key is required." }, { status: 400 });
    }

    const objectKey = key.join("/");
    const r2Object = await getObjectFromR2(objectKey);

    if (!r2Object || !r2Object.Body) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // Convert AWS SDK Stream to ArrayBuffer
    const byteArray = await r2Object.Body.transformToByteArray();

    const headers = new Headers();
    headers.set("Content-Type", r2Object.ContentType || "image/png");
    if (r2Object.ContentLength) {
      headers.set("Content-Length", String(r2Object.ContentLength));
    }
    if (r2Object.ETag) {
      headers.set("ETag", r2Object.ETag);
    }
    // High-performance immutable caching for static uploaded media
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(Buffer.from(byteArray), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    console.error("Error streaming file from R2:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file from storage." },
      { status: 500 }
    );
  }
}
