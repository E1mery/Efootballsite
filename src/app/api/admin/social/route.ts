import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

    const settings = await prisma.socialAutomationSetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        autoPublishMotd: true,
        autoPublishMotdRes: true,
        autoPublishMotw: true,
        autoPublishMotwRes: true,
        autoRivalryThread: true,
      },
    });

    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const updated = await prisma.socialAutomationSetting.upsert({
      where: { id: "default" },
      update: {
        ...(typeof body.autoPublishMotd === "boolean" && { autoPublishMotd: body.autoPublishMotd }),
        ...(typeof body.autoPublishMotdRes === "boolean" && { autoPublishMotdRes: body.autoPublishMotdRes }),
        ...(typeof body.autoPublishMotw === "boolean" && { autoPublishMotw: body.autoPublishMotw }),
        ...(typeof body.autoPublishMotwRes === "boolean" && { autoPublishMotwRes: body.autoPublishMotwRes }),
        ...(typeof body.autoRivalryThread === "boolean" && { autoRivalryThread: body.autoRivalryThread }),
      },
      create: {
        id: "default",
        ...body,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");
    const postId = searchParams.get("postId");

    if (commentId) {
      await prisma.socialComment.delete({
        where: { id: commentId },
      });
      return NextResponse.json({ success: true, message: "Comment deleted." });
    }

    if (postId) {
      await prisma.socialPost.delete({
        where: { id: postId },
      });
      return NextResponse.json({ success: true, message: "Post deleted." });
    }

    return NextResponse.json({ error: "Missing commentId or postId." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
