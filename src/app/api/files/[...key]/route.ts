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

    if (!r2Object) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // 1. Native Cloudflare R2 Object (Edge runtime)
    if ("body" in r2Object && r2Object.body) {
      const headers = new Headers();
      headers.set("Content-Type", r2Object.httpMetadata?.contentType || "image/png");
      if (r2Object.size) {
        headers.set("Content-Length", String(r2Object.size));
      }
      if (r2Object.httpEtag) {
        headers.set("ETag", r2Object.httpEtag);
      }
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(r2Object.body, {
        status: 200,
        headers,
      });
    }

    // 2. AWS SDK S3 Object (Node.js runtime / local fallback)
    if (r2Object.Body) {
      let bodyData: any;
      if (typeof r2Object.Body.transformToByteArray === "function") {
        const byteArray = await r2Object.Body.transformToByteArray();
        bodyData = Buffer.from(byteArray);
      } else {
        bodyData = r2Object.Body;
      }

      const headers = new Headers();
      headers.set("Content-Type", r2Object.ContentType || "image/png");
      if (r2Object.ContentLength) {
        headers.set("Content-Length", String(r2Object.ContentLength));
      }
      if (r2Object.ETag) {
        headers.set("ETag", r2Object.ETag);
      }
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(bodyData, {
        status: 200,
        headers,
      });
    }

    return NextResponse.json({ error: "File not found." }, { status: 404 });
  } catch (error: any) {
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    console.error("Error streaming file from R2:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file from storage.", details: error?.message },
      { status: 500 }
    );
  }
}
