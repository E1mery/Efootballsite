import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  getFinalsSocialOverview,
  syncFinalAnnouncementPost,
  syncFinalResultPost,
  updateFinalMatchSchedule,
} from "@/lib/finalsSocialService";
import { syncAllFinalsSocialPosts } from "@/lib/socialFeedService";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) {
    return { error: "Unauthorized. Please log in as an administrator.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Forbidden. Administrator role required.", status: 403 };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const finals = await getFinalsSocialOverview();
    return NextResponse.json({ success: true, finals });
  } catch (err: any) {
    console.error("[GET /api/admin/finals-social] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load finals social data." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { action, matchId, scheduledDate } = body;

    if (action === "SYNC_ALL") {
      await syncAllFinalsSocialPosts();
      const updatedOverview = await getFinalsSocialOverview();
      return NextResponse.json({
        success: true,
        message: "All finals fixtures successfully synchronized to the social feed.",
        finals: updatedOverview,
      });
    }

    if (action === "PUBLISH_ANNOUNCEMENT") {
      if (!matchId) {
        return NextResponse.json({ error: "Missing matchId." }, { status: 400 });
      }

      const post = await syncFinalAnnouncementPost(matchId);
      return NextResponse.json({
        success: true,
        message: "Official final announcement post generated and published to social feed.",
        post,
      });
    }

    if (action === "PUBLISH_RESULT") {
      if (!matchId) {
        return NextResponse.json({ error: "Missing matchId." }, { status: 400 });
      }

      const post = await syncFinalResultPost(matchId);
      return NextResponse.json({
        success: true,
        message: "Official full-time result post generated and published to social feed.",
        post,
      });
    }

    if (action === "UPDATE_SCHEDULE") {
      if (!matchId || !scheduledDate) {
        return NextResponse.json({ error: "Match ID and scheduledDate are required." }, { status: 400 });
      }

      const { match, post } = await updateFinalMatchSchedule(matchId, scheduledDate);
      return NextResponse.json({
        success: true,
        message: "Kickoff date & time updated! Announcement post has been synchronized with the latest schedule.",
        match,
        post,
      });
    }

    if (action === "RETRY") {
      if (!matchId) {
        return NextResponse.json({ error: "Missing matchId." }, { status: 400 });
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
      }

      // Sync announcement
      const announcementPost = await syncFinalAnnouncementPost(match.id);

      // If finished, also sync result
      let resultPost = null;
      if (match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null) {
        resultPost = await syncFinalResultPost(match.id);
      }

      return NextResponse.json({
        success: true,
        message: "Publication retried and synchronized successfully.",
        announcementPost,
        resultPost,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/admin/finals-social] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process request." }, { status: 500 });
  }
}
