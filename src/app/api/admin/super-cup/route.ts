import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSuperCupOverview, generateSuperCupFixture } from "@/lib/superCupService";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const season = config?.season || "Season 1 (2026)";

    const overview = await getSuperCupOverview(season);
    return NextResponse.json(overview);
  } catch (err: any) {
    console.error("Super Cup admin GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin office access required." }, { status: 403 });
    }

    const body = await req.json();
    const { action, scheduledDate } = body;

    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const season = config?.season || "Season 1 (2026)";

    if (action === "GENERATE_FIXTURE") {
      const match = await generateSuperCupFixture(
        season,
        scheduledDate ? new Date(scheduledDate) : undefined
      );

      return NextResponse.json({
        success: true,
        message: `Successfully generated UEFA Super Cup fixture: @${match.homePlayer?.gamerTag} vs @${match.awayPlayer?.gamerTag}!`,
        match,
      });
    }

    if (action === "SCHEDULE_MATCH") {
      if (!scheduledDate) {
        return NextResponse.json({ error: "Scheduled date is required." }, { status: 400 });
      }

      const matchDate = new Date(scheduledDate);
      const deadlineDate = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);

      let existingMatch = await prisma.match.findFirst({
        where: { division: "SUPER_CUP", stage: "FINAL" },
        include: { homePlayer: true, awayPlayer: true },
      });

      if (!existingMatch) {
        // Automatically generate fixture with this kickoff date if not already created
        const newFixture = await generateSuperCupFixture(season, matchDate);
        return NextResponse.json({
          success: true,
          message: `Generated UEFA Super Cup fixture and scheduled kickoff for ${newFixture.homePlayer?.gamerTag} vs ${newFixture.awayPlayer?.gamerTag}!`,
          match: newFixture,
        });
      }

      const updated = await prisma.match.update({
        where: { id: existingMatch.id },
        data: { matchDate, deadlineDate },
        include: { homePlayer: true, awayPlayer: true },
      });

      try {
        const { syncFinalAnnouncementForMatch } = await import("@/lib/socialFeedService");
        await syncFinalAnnouncementForMatch(updated.id);
      } catch (socialErr) {
        console.error("[SCHEDULE_MATCH] Error syncing Super Cup to social feed:", socialErr);
      }

      return NextResponse.json({
        success: true,
        message: "Super Cup kickoff date and deadline updated successfully.",
        match: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("Super Cup admin POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
