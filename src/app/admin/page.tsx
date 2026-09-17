import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (!sessionUserId) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login?error=admin_required");
  }

  const [
    matches,
    pendingSubmissions,
    pendingForfeits,
    allPlayers,
    announcements,
    flaggedPlayers,
    leagueConfig,
    div1Standings,
    div2Standings,
    div3Standings,
    uclSlots,
    europaSlots,
    pendingPlayers,
    reservePlayers,
    hallOfFameEntries,
    playerMessages,
    reviews,
  ] = await Promise.all([
    prisma.match.findMany({
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: {
          include: { submittedByPlayer: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ round: "asc" }, { matchDate: "asc" }],
    }),
    prisma.matchSubmission.findMany({
      where: { status: "PENDING" },
      include: {
        match: { include: { homePlayer: true, awayPlayer: true } },
        submittedByPlayer: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.forfeitClaim.findMany({
      where: { status: "PENDING" },
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
      where: { division: "Division 1" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.standing.findMany({
      where: { division: "Division 2" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.standing.findMany({
      where: { division: "Division 3" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.uclGroupSlot.findMany({
      where: { competition: "UCL" },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
    prisma.uclGroupSlot.findMany({
      where: { competition: "EUROPA" },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
    prisma.player.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.player.findMany({
      where: { status: "RESERVED" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hallOfFame.findMany({
      orderBy: [{ season: "desc" }, { createdAt: "desc" }],
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
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <AdminClient
        matches={matches}
        pendingSubmissions={pendingSubmissions}
        pendingForfeits={pendingForfeits}
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
      />
    </div>
  );
}
