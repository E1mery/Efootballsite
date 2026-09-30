import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";

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

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureNewsTable();
    const news = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    console.error("[GET /api/admin/news] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch news articles." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureNewsTable();
    const body = await req.json();
    const {
      title,
      category,
      featuredImage,
      description,
      buttonText,
      buttonUrl,
      status = "DRAFT",
      publishDate,
      expirationDate,
      showOnCarousel = true,
    } = body;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    if (!featuredImage || typeof featuredImage !== "string" || !featuredImage.trim()) {
      return NextResponse.json(
        { error: "Featured image is required." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 }
      );
    }

    if (!expirationDate) {
      return NextResponse.json(
        { error: "Expiration date and time are required." },
        { status: 400 }
      );
    }

    const parsedPublishDate = publishDate ? new Date(publishDate) : new Date();
    const parsedExpirationDate = new Date(expirationDate);

    if (isNaN(parsedPublishDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid publish date format." },
        { status: 400 }
      );
    }

    if (isNaN(parsedExpirationDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiration date format." },
        { status: 400 }
      );
    }

    if (parsedExpirationDate <= parsedPublishDate) {
      return NextResponse.json(
        { error: "Expiration date must be after publish date." },
        { status: 400 }
      );
    }

    const validStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const news = await prisma.news.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        featuredImage: featuredImage.trim(),
        description: description.trim(),
        buttonText: buttonText?.trim() || null,
        buttonUrl: buttonUrl?.trim() || null,
        status: validStatus,
        publishDate: parsedPublishDate,
        expirationDate: parsedExpirationDate,
        showOnCarousel: Boolean(showOnCarousel),
      },
    });

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    console.error("[POST /api/admin/news] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create news article." },
      { status: 500 }
    );
  }
}
