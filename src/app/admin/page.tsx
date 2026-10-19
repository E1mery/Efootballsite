import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import { ensurePasswordResetTable } from "@/lib/passwordReset";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { cleanupExpiredRepliedMessages } from "@/lib/messageCleanup";
import { cleanupExpiredAnnouncements } from "@/lib/announcementCleanup";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";
import { ensureDerbyTable } from "@/lib/derbyService";
import { syncPlayerDiscipline } from "@/lib/consecutiveMissed";

export const dynamic = "force-dynamic";

// In-memory throttling for periodic maintenance so it never blocks page renders
let lastMaintenanceTime = 0;
const MAINTENANCE_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

function triggerAdminBackgroundMaintenance() {
  const now = Date.now();
  if (now - lastMaintenanceTime < MAINTENANCE_COOLDOWN_MS) return;
  lastMaintenanceTime = now;

  // Run in background without awaiting to keep admin load instant
  (async () => {
    try {
      await Promise.allSettled([
        cleanupExpiredRepliedMessages(),
        cleanupExpiredAnnouncements(),
        ensureNewsTable(),
        ensureDerbyTable(),
        syncSystemNewsToCarousel(),
        syncPlayerDiscipline(),
        ensurePasswordResetTable(),
      ]);
    } catch (err) {
      console.error("Background maintenance task error:", err);
    }
  })();
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  // Trigger maintenance tasks non-blocking so the admin portal renders immediately
  triggerAdminBackgroundMaintenance();

  const [
    matches,
    pendingSubmissions,
    allForfeitClaims,
    allPlayers,
    announcements,
    flaggedPlayers,
    leagueConfig,
    allDivisionStandings,
    allGroupSlots,
    nonActivePlayers,
    hallOfFameEntries,
    playerMessages,
    reviews,
    newsArticles,
    rawPasswordResets,
  ] = await Promise.all([
    prisma.match.findMany({
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: {
          where: { status: { not: "REPLACED" } },
          include: { submittedByPlayer: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ round: "asc" }, { matchDate: "asc" }],
    }),
    prisma.matchSubmission.findMany({
      where: { status: { not: "REPLACED" } },
      include: {
        match: { include: { homePlayer: true, awayPlayer: true } },
        submittedByPlayer: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.forfeitClaim.findMany({
      include: {
        match: { include: { homePlayer: true, awayPlayer: true } },
        claimantPlayer: true,
        accusedPlayer: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.player.findMany({
      where: { status: { in: ["ACTIVE", "WARNING", "DISQUALIFIED"] } },
      include: { user: true },
      orderBy: [{ division: "asc" }, { gamerTag: "asc" }],
    }),
    prisma.announcement.findMany({
      include: { targetPlayer: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.player.findMany({
      where: {
        OR: [{ consecutiveMissed: { gte: 2 } }, { isDisqualified: true }],
      },
    }),
    prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        registrationOpen: true,
        currentMatchday: 1,
        uclStarted: false,
        europaStarted: false,
      },
    }),
    prisma.standing.findMany({
      where: {
        division: { in: ["Division 1", "Division 2", "Division 3"] },
        player: { status: { in: ["ACTIVE", "WARNING"] } },
      },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.uclGroupSlot.findMany({
      where: { competition: { in: ["UCL", "EUROPA"] } },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
    prisma.player.findMany({
      where: { status: { in: ["PENDING_APPROVAL", "RESERVED"] } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hallOfFame.findMany({
      orderBy: [{ season: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    (prisma as any).playerMessage.findMany({
      include: {
        player: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            division: true,
            whatsapp: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.feedbackReview.findMany({
      include: {
        player: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            division: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    (prisma as any).passwordResetRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
  ]);

  // Split merged standings
  const div1Standings = allDivisionStandings.filter((s) => s.division === "Division 1");
  const div2Standings = allDivisionStandings.filter((s) => s.division === "Division 2");
  const div3Standings = allDivisionStandings.filter((s) => s.division === "Division 3");

  // Split merged continental slots
  const uclSlots = allGroupSlots.filter((s) => s.competition === "UCL");
  const europaSlots = allGroupSlots.filter((s) => s.competition === "EUROPA");

  // Split merged pending and reserve players
  const pendingPlayers = nonActivePlayers.filter((p) => p.status === "PENDING_APPROVAL");
  const reservePlayers = nonActivePlayers.filter((p) => p.status === "RESERVED");

  // Enrich password reset requests with user and athlete details
  const passwordResets = rawPasswordResets || [];
  const resetEmails: string[] = Array.from(
    new Set(passwordResets.map((r: any) => String(r.email)).filter(Boolean))
  );
  let resetUsers: any[] = [];
  try {
    if (resetEmails.length > 0) {
      resetUsers = await prisma.user.findMany({
        where: { email: { in: resetEmails } },
        include: { player: true },
      });
    }
  } catch (uErr) {
    console.error("Safely caught resetUsers query error:", uErr);
  }

  const userMap = new Map<string, any>();
  for (const u of resetUsers) {
    userMap.set(u.email, u);
  }

  const enrichedPasswordResets = passwordResets.map((r: any) => {
    const u = userMap.get(r.email);
    return {
      ...r,
      user: u ? { id: u.id, email: u.email, role: u.role } : null,
      player: u?.player || null,
    };
  });

  const pendingForfeits = allForfeitClaims.filter((c: any) => c.status === "PENDING");

  return (
    <AdminShell
      matches={matches}
      pendingSubmissions={pendingSubmissions}
      pendingForfeits={pendingForfeits}
      allForfeits={allForfeitClaims}
      allPlayers={allPlayers}
      announcements={announcements}
      flaggedPlayers={flaggedPlayers}
      leagueConfig={leagueConfig}
      div1Standings={div1Standings}
      div2Standings={div2Standings}
      div3Standings={div3Standings}
      uclSlots={uclSlots}
      europaSlots={europaSlots}
      adminEmail={user.email}
      initialPendingPlayers={pendingPlayers}
      initialReservePlayers={reservePlayers}
      initialHallOfFame={hallOfFameEntries}
      initialPlayerMessages={playerMessages}
      initialReviews={reviews}
      initialPasswordResets={enrichedPasswordResets}
      initialNews={newsArticles}
    />
  );
}

