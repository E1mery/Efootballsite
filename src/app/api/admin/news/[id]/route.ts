import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { ensureR2FileUrl } from "@/lib/r2";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Forbidden. Admin access required.", status: 403 };
  }

  return { user };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await ensureNewsTable();

    const news = await prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      return NextResponse.json({ error: "News not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    console.error("[GET /api/admin/news/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch news." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await ensureNewsTable();

    const existing = await prisma.news.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "News not found." }, { status: 404 });
    }

    const body = await req.json();

    // Support partial updates (e.g. quick toggle of showOnCarousel or status) or full updates
    const dataToUpdate: any = {};

    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      dataToUpdate.title = body.title.trim();
    }

    if (body.category !== undefined) {
      if (!body.category || typeof body.category !== "string" || !body.category.trim()) {
        return NextResponse.json({ error: "Category cannot be empty." }, { status: 400 });
      }
      dataToUpdate.category = body.category.trim();
    }

    const effectiveCategory = dataToUpdate.category ?? existing.category ?? "";
    const effectiveTitle = dataToUpdate.title ?? existing.title ?? "";
    const effectiveDesc = dataToUpdate.description ?? existing.description ?? "";
    const effectiveUrl = dataToUpdate.buttonUrl ?? existing.buttonUrl ?? "";
    const isEuropaNews =
      effectiveCategory.toLowerCase().includes("europa") ||
      effectiveTitle.toLowerCase().includes("europa") ||
      effectiveDesc.toLowerCase().includes("europa") ||
      effectiveUrl.toLowerCase().includes("europa");

    const isUclNews =
      !isEuropaNews &&
      (effectiveCategory.toLowerCase().includes("ucl") ||
        effectiveTitle.toLowerCase().includes("ucl") ||
        effectiveTitle.toLowerCase().includes("champions league") ||
        effectiveDesc.toLowerCase().includes("ucl") ||
        effectiveDesc.toLowerCase().includes("champions league") ||
        effectiveUrl.toLowerCase().includes("ucl"));

    if (body.featuredImage !== undefined) {
      let resolvedImg = body.featuredImage ? body.featuredImage.trim() : "";
      if (isEuropaNews && (!resolvedImg || resolvedImg === "/images/carousel-stadium-bg.jpg" || resolvedImg === "/images/ucl-stadium-bg.jpg")) {
        resolvedImg = "/images/europa-stadium-bg.jpg";
      } else if (isUclNews && (!resolvedImg || resolvedImg === "/images/carousel-stadium-bg.jpg" || resolvedImg === "/images/europa-stadium-bg.jpg")) {
        resolvedImg = "/images/ucl-stadium-bg.jpg";
      }
      if (!resolvedImg) {
        return NextResponse.json({ error: "Featured image cannot be empty." }, { status: 400 });
      }
      dataToUpdate.featuredImage = await ensureR2FileUrl(resolvedImg, "news");
    } else if (isEuropaNews && (existing.featuredImage === "/images/carousel-stadium-bg.jpg" || existing.featuredImage === "/images/ucl-stadium-bg.jpg")) {
      dataToUpdate.featuredImage = "/images/europa-stadium-bg.jpg";
    } else if (isUclNews && (existing.featuredImage === "/images/carousel-stadium-bg.jpg" || existing.featuredImage === "/images/europa-stadium-bg.jpg")) {
      dataToUpdate.featuredImage = "/images/ucl-stadium-bg.jpg";
    }

    if (body.description !== undefined) {
      if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
        return NextResponse.json({ error: "Description cannot be empty." }, { status: 400 });
      }
      dataToUpdate.description = body.description.trim();
    }

    if (body.buttonText !== undefined) {
      dataToUpdate.buttonText = body.buttonText?.trim() || null;
    }

    if (body.buttonUrl !== undefined) {
      dataToUpdate.buttonUrl = body.buttonUrl?.trim() || null;
    }

    if (body.status !== undefined) {
      if (body.status !== "DRAFT" && body.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Status must be DRAFT or PUBLISHED." }, { status: 400 });
      }
      dataToUpdate.status = body.status;
    }

    if (body.showOnCarousel !== undefined) {
      dataToUpdate.showOnCarousel = Boolean(body.showOnCarousel);
    }

    let publishDate = existing.publishDate;
    if (body.publishDate !== undefined) {
      const parsed = new Date(body.publishDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid publish date." }, { status: 400 });
      }
      publishDate = parsed;
      dataToUpdate.publishDate = parsed;
    }

    let expirationDate = existing.expirationDate;
    if (body.expirationDate !== undefined) {
      const parsed = new Date(body.expirationDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid expiration date." }, { status: 400 });
      }
      expirationDate = parsed;
      dataToUpdate.expirationDate = parsed;
    }

    if (expirationDate <= publishDate) {
      return NextResponse.json(
        { error: "Expiration date must be after publish date." },
        { status: 400 }
      );
    }

    const updated = await prisma.news.update({
      where: { id },
      data: dataToUpdate,
    });

    if (id.startsWith("sys-")) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "EditedSystemNews" ("id") VALUES ($1) ON CONFLICT ("id") DO UPDATE SET "editedAt" = CURRENT_TIMESTAMP`,
        id
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, news: updated });
  } catch (error: any) {
    console.error("[PUT /api/admin/news/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update news article." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await ensureNewsTable();

    const existing = await prisma.news.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "News not found." }, { status: 404 });
    }

    await prisma.news.delete({
      where: { id },
    });

    if (id.startsWith("sys-")) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DismissedSystemNews" ("id") VALUES ($1) ON CONFLICT ("id") DO NOTHING`,
        id
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "News permanently deleted." });
  } catch (error: any) {
    console.error("[DELETE /api/admin/news/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete news article." },
      { status: 500 }
    );
  }
}
