import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber, isSamePhoneNumber } from "@/lib/phone";


export interface DuplicateReport {
  scannedUsers: number;
  scannedPlayers: number;
  emailDuplicatesFound: number;
  phoneDuplicatesFound: number;
  deletedUsers: string[];
  deletedPlayers: string[];
  standardizedPhones: number;
  deletedDuplicateStandings: number;
}

export async function verifyAndCleanDuplicates(dryRun = false): Promise<DuplicateReport> {
  const report: DuplicateReport = {
    scannedUsers: 0,
    scannedPlayers: 0,
    emailDuplicatesFound: 0,
    phoneDuplicatesFound: 0,
    deletedUsers: [],
    deletedPlayers: [],
    standardizedPhones: 0,
    deletedDuplicateStandings: 0,
  };

  // 1. Fetch all users and players with full activity relations
  const users = await prisma.user.findMany({
    include: {
      player: {
        include: {
          standings: true,
          matchSubmissions: true,
          forfeitClaimsMade: true,
          forfeitClaimsAgainst: true,
          homeMatches: true,
          awayMatches: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const players = await prisma.player.findMany({
    include: {
      user: true,
      standings: true,
      matchSubmissions: true,
      forfeitClaimsMade: true,
      forfeitClaimsAgainst: true,
      homeMatches: true,
      awayMatches: true,
    },
    orderBy: { createdAt: "asc" },
  });

  report.scannedUsers = users.length;
  report.scannedPlayers = players.length;

  console.log(`[Deduplicate] Scanning ${users.length} users and ${players.length} players...`);

  // Helper to score account importance to keep the right one
  function getScore(p: any, u: any): number {
    let score = 0;
    if (u?.role === "ADMIN") score += 10000;
    if (p) {
      score += (p.matchesPlayed || 0) * 100;
      score += (p.homeMatches?.length || 0) * 50;
      score += (p.awayMatches?.length || 0) * 50;
      score += (p.matchSubmissions?.length || 0) * 50;
      score += (p.standings?.length || 0) * 20;
      if (p.status === "ACTIVE") score += 10;
    }
    return score;
  }

  // 2. Check for Email duplicates
  const emailMap = new Map<string, typeof users>();
  for (const u of users) {
    const key = u.email.trim().toLowerCase();
    if (!emailMap.has(key)) emailMap.set(key, []);
    emailMap.get(key)!.push(u);
  }

  for (const [email, duplicateList] of emailMap.entries()) {
    if (duplicateList.length > 1) {
      report.emailDuplicatesFound += duplicateList.length - 1;
      console.log(`[Deduplicate] Found ${duplicateList.length} duplicate accounts for email: "${email}"`);

      // Sort: highest score first, then earliest created first
      duplicateList.sort((a, b) => {
        const scoreA = getScore(a.player, a);
        const scoreB = getScore(b.player, b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const primary = duplicateList[0];
      const duplicatesToDelete = duplicateList.slice(1);

      console.log(`  -> Keeping primary user: ${primary.id} (Role: ${primary.role}, Created: ${primary.createdAt})`);

      for (const dup of duplicatesToDelete) {
        console.log(`  -> Deleting duplicate user: ${dup.id} (Created: ${dup.createdAt})`);
        if (!dryRun) {
          await prisma.user.delete({ where: { id: dup.id } });
          report.deletedUsers.push(dup.id);
        }
      }
    }
  }

  // Re-fetch remaining players after email cleanup
  const remainingPlayers = await prisma.player.findMany({
    include: {
      user: true,
      standings: true,
      matchSubmissions: true,
      forfeitClaimsMade: true,
      forfeitClaimsAgainst: true,
      homeMatches: true,
      awayMatches: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 3. Check for Phone Number (WhatsApp) duplicates
  // Group players by same phone number using isSamePhoneNumber
  const phoneGroups: Array<typeof remainingPlayers> = [];
  const processedPlayerIds = new Set<string>();

  for (let i = 0; i < remainingPlayers.length; i++) {
    const p1 = remainingPlayers[i];
    if (processedPlayerIds.has(p1.id)) continue;

    const group = [p1];
    processedPlayerIds.add(p1.id);

    for (let j = i + 1; j < remainingPlayers.length; j++) {
      const p2 = remainingPlayers[j];
      if (processedPlayerIds.has(p2.id)) continue;

      if (isSamePhoneNumber(p1.whatsapp, p2.whatsapp)) {
        group.push(p2);
        processedPlayerIds.add(p2.id);
      }
    }

    if (group.length > 1) {
      phoneGroups.push(group);
    }
  }

  for (const group of phoneGroups) {
    report.phoneDuplicatesFound += group.length - 1;
    console.log(`[Deduplicate] Found ${group.length} players with identical phone: "${group[0].whatsapp}"`);

    // Sort: highest score first, then earliest created
    group.sort((a, b) => {
      const scoreA = getScore(a, a.user);
      const scoreB = getScore(b, b.user);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const primaryPlayer = group[0];
    const duplicatesToDelete = group.slice(1);

    console.log(`  -> Keeping primary player: @${primaryPlayer.gamerTag} (${primaryPlayer.id})`);

    for (const dup of duplicatesToDelete) {
      console.log(`  -> Deleting duplicate player: @${dup.gamerTag} (${dup.id})`);
      if (!dryRun) {
        if (dup.userId) {
          await prisma.user.delete({ where: { id: dup.userId } }).catch(async () => {
            await prisma.player.delete({ where: { id: dup.id } });
          });
          report.deletedUsers.push(dup.userId);
        } else {
          await prisma.player.delete({ where: { id: dup.id } });
        }
        report.deletedPlayers.push(dup.id);
      }
    }
  }

  // 4. Standardize phone numbers to canonical E.164 format (+250...) for consistency
  const activePlayers = await prisma.player.findMany({ select: { id: true, gamerTag: true, whatsapp: true } });
  for (const p of activePlayers) {
    const norm = normalizePhoneNumber(p.whatsapp);
    if (norm.isValid && norm.formatted !== p.whatsapp) {
      console.log(`[Standardize] Updating @${p.gamerTag} phone: "${p.whatsapp}" -> "${norm.formatted}"`);
      if (!dryRun) {
        await prisma.player.update({
          where: { id: p.id },
          data: { whatsapp: norm.formatted },
        });
      }
      report.standardizedPhones++;
    }
  }

  // 5. Check and clean duplicate or mismatched Division Standings
  const allDivisionStandings = await prisma.standing.findMany({
    where: { tournament: { type: "DIVISION" } },
    include: { player: true, tournament: true },
  });

  const playerDivisionStandings = new Map<string, typeof allDivisionStandings>();
  for (const s of allDivisionStandings) {
    // If standing is mismatched with player's registered division or wrong tournament name
    const isMismatchedPlayer = s.player && s.player.division !== s.division;
    const isWrongTournament = s.tournament && !s.tournament.name.toLowerCase().includes(s.division.toLowerCase());
    const isReserved = s.player && s.player.status === "RESERVED";

    if (isMismatchedPlayer || isWrongTournament || isReserved) {
      console.log(`[Deduplicate] Removing invalid standing: ID ${s.id} (@${s.player?.gamerTag} in ${s.division} on tourn ${s.tournament?.name})`);
      if (!dryRun) {
        await prisma.standing.delete({ where: { id: s.id } }).catch(() => {});
      }
      report.deletedDuplicateStandings++;
      continue;
    }

    const key = `${s.playerId}_${s.division}`;
    if (!playerDivisionStandings.has(key)) {
      playerDivisionStandings.set(key, []);
    }
    playerDivisionStandings.get(key)!.push(s);
  }

  // Remove duplicate standings for the same player in the same division
  for (const [key, sList] of playerDivisionStandings.entries()) {
    if (sList.length > 1) {
      console.log(`[Deduplicate] Found ${sList.length} duplicate standings for ${key}`);
      // Keep first, delete rest
      const duplicates = sList.slice(1);
      for (const dup of duplicates) {
        if (!dryRun) {
          await prisma.standing.delete({ where: { id: dup.id } }).catch(() => {});
        }
        report.deletedDuplicateStandings++;
      }
    }
  }

  console.log(`[Deduplicate] Complete! Report:`, report);
  return report;
}

if (require.main === module) {
  verifyAndCleanDuplicates(false)
    .then((r) => {
      console.log("\nExecution completed successfully:", JSON.stringify(r, null, 2));
    })
    .catch((err) => {
      console.error("Execution failed:", err);
    })
    .finally(() => prisma.$disconnect());
}
