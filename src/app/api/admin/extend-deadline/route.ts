import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatRwandanDateTime } from "@/lib/rwandanTime";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { syncPlayerDiscipline } from "@/lib/consecutiveMissed";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const { matchId, extensionHours = 24, allowLateSubmission = true, customNotes } = body;

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required." }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homePlayer: true, awayPlayer: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    const newDeadline = new Date(Date.now() + Number(extensionHours) * 60 * 60 * 1000);

    const isAutoDrawOrMissed = Boolean(
      match.notes?.includes("Automatic 0-0 Draw") ||
      match.notes?.includes("missed match") ||
      match.notes?.includes("elapsed without submitted score")
    );

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        allowLateSubmission: Boolean(allowLateSubmission),
        extendedDeadlineDate: newDeadline,
        deadlineDate: newDeadline,
        status: allowLateSubmission ? "SCHEDULED" : match.status,
        homeScore: (allowLateSubmission || isAutoDrawOrMissed) ? null : undefined,
        awayScore: (allowLateSubmission || isAutoDrawOrMissed) ? null : undefined,
        notes: customNotes || `Deadline extended by Admin Office until ${formatRwandanDateTime(newDeadline)} (CAT). Late result upload granted.`,
      },
    });

    if (isAutoDrawOrMissed || allowLateSubmission) {
      const divToRecalc =
        match.stage === "GROUP" && match.groupName
          ? `${match.division} ${match.groupName}`
          : match.division;
      await recalculateStandings(match.tournamentId, divToRecalc).catch(() => {});
      await syncPlayerDiscipline(
        [match.homePlayerId, match.awayPlayerId].filter((id): id is string => Boolean(id))
      ).catch(() => {});
    }

    // Notify both athletes
    const notifyTitle = `⏰ Match Deadline Extended: ${match.round}`;
    const notifyContent = `The League Commissioner has extended the result upload deadline for your match (${match.homePlayer.gamerTag} vs ${match.awayPlayer.gamerTag}) until ${formatRwandanDateTime(newDeadline)} (CAT / Rwandan Time). You can now upload your match results and screenshot proof.`;

    await prisma.announcement.createMany({
      data: [
        {
          title: notifyTitle,
          content: notifyContent,
          type: "INDIVIDUAL",
          targetPlayerId: match.homePlayerId,
        },
        {
          title: notifyTitle,
          content: notifyContent,
          type: "INDIVIDUAL",
          targetPlayerId: match.awayPlayerId,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Deadline successfully extended for match ${match.homePlayer.gamerTag} vs ${match.awayPlayer.gamerTag} by ${extensionHours} hours.`,
      match: updatedMatch,
    });
  } catch (err: any) {
    console.error("Extend deadline error:", err);
    return NextResponse.json({ error: err.message || "Failed to extend deadline." }, { status: 500 });
  }
}
