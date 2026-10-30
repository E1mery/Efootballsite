import { prisma } from "@/lib/prisma";
import {
  DerbyConfiguration,
  INITIAL_OFFICIAL_DERBIES,
  resolveCanonicalClubId,
  areBothClubsAvailableInLeague,
  detectDerby,
  PlayerDerbyStats,
  ClubDerbyH2H,
} from "./derbyCore";

export * from "./derbyCore";

let derbyTableEnsured = false;

/**
 * Ensures Derby table and related columns exist in the database.
 * Auto-seeds initial official derbies if the table is empty.
 */
export async function ensureDerbyTable(): Promise<void> {
  if (derbyTableEnsured) return;

  try {
    // 1. Create Derby table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Derby" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "shortName" TEXT NOT NULL,
        "club1Id" TEXT NOT NULL,
        "club2Id" TEXT NOT NULL,
        "club1Name" TEXT NOT NULL,
        "club2Name" TEXT NOT NULL,
        "competition" TEXT,
        "description" TEXT,
        "imageUrl" TEXT,
        "isHistoricRivalry" BOOLEAN NOT NULL DEFAULT false,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "autoPublishSocial" BOOLEAN NOT NULL DEFAULT false,
        "autoPublishCarousel" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Helper for safe column addition across SQLite and Postgres
    const safeAddColumn = async (table: string, column: string, typeDef: string) => {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${typeDef}`);
      } catch {}
    };

    // 2. Ensure columns exist on Match
    await safeAddColumn("Match", "derbyId", "TEXT");
    await safeAddColumn("Match", "isDerby", "BOOLEAN NOT NULL DEFAULT 0");
    await safeAddColumn("Match", "derbyName", "TEXT");

    // 3. Ensure columns exist on ArchivedMatch
    await safeAddColumn("ArchivedMatch", "derbyId", "TEXT");
    await safeAddColumn("ArchivedMatch", "derbyName", "TEXT");

    // 4. Ensure columns exist on SocialPost
    await safeAddColumn("SocialPost", "derbyId", "TEXT");
    await safeAddColumn("SocialPost", "derbyName", "TEXT");

    // 5. Seed initial official derbies if table is empty
    const count = await prisma.derby.count().catch(() => 0);
    if (count === 0) {
      for (const d of INITIAL_OFFICIAL_DERBIES) {
        await prisma.derby
          .create({
            data: d,
          })
          .catch(() => {});
      }
    }

    derbyTableEnsured = true;
  } catch (err) {
    console.error("[ensureDerbyTable] Error ensuring Derby schema:", err);
  }
}

/**
 * Retrieves all derbies from DB, or fallback in-memory initial list.
 */
export async function getAllDerbies(): Promise<DerbyConfiguration[]> {
  try {
    await ensureDerbyTable();
    const rows = await prisma.derby.findMany({
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    });
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch {
    // fallback if DB not yet reachable
  }

  return INITIAL_OFFICIAL_DERBIES.map((d, i) => ({
    ...d,
    id: `seed-derby-${i + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/**
 * Retrieves all active derbies where both participating clubs exist in the league.
 */
export async function getActiveDerbies(): Promise<DerbyConfiguration[]> {
  const all = await getAllDerbies();
  return all.filter((d) => d.isActive && areBothClubsAvailableInLeague(d.club1Id, d.club2Id));
}

/**
 * Synchronizes and persists derby identity for a specific match fixture.
 */
export async function syncMatchDerby(matchId: string): Promise<DerbyConfiguration | null> {
  try {
    await ensureDerbyTable();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    if (!match) return null;

    const activeDerbies = await getActiveDerbies();
    const detected = detectDerby(match.homePlayer, match.awayPlayer, activeDerbies);

    if (detected) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          derbyId: detected.id,
          isDerby: true,
          derbyName: detected.name,
        },
      });
    } else if (match.isDerby) {
      // Re-evaluated safely if an admin corrected the teams
      await prisma.match.update({
        where: { id: match.id },
        data: {
          derbyId: null,
          isDerby: false,
          derbyName: null,
        },
      });
    }

    return detected;
  } catch (err) {
    console.error("[syncMatchDerby] Error synchronizing match derby:", err);
    return null;
  }
}

/**
 * Calculates a player's derby performance records strictly using confirmed match results.
 * STRICT REQUIREMENT: Only returns matchesPlayed, wins, draws, defeats.
 * NEVER calculates, stores, or exposes derby win rate or derby win percentage.
 */
export async function getPlayerDerbyStats(playerId: string): Promise<PlayerDerbyStats> {
  if (!playerId) {
    return { matchesPlayed: 0, wins: 0, draws: 0, defeats: 0 };
  }

  try {
    await ensureDerbyTable();
    const activeDerbies = await getActiveDerbies();

    const confirmedMatches = await prisma.match.findMany({
      where: {
        OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }],
        status: { in: ["FINISHED", "FORFEIT"] },
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    let matchesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let defeats = 0;

    for (const m of confirmedMatches) {
      // Check if match is a derby
      const derby = m.isDerby && m.derbyName
        ? { name: m.derbyName }
        : detectDerby(m.homePlayer, m.awayPlayer, activeDerbies);

      if (!derby) continue;

      const isHome = m.homePlayerId === playerId;
      const myScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);

      matchesPlayed += 1;

      if (myScore > oppScore) {
        wins += 1;
      } else if (myScore < oppScore) {
        defeats += 1;
      } else {
        draws += 1;
      }
    }

    return {
      matchesPlayed,
      wins,
      draws,
      defeats,
    };
  } catch (err) {
    console.error("[getPlayerDerbyStats] Error calculating player derby stats:", err);
    return { matchesPlayed: 0, wins: 0, draws: 0, defeats: 0 };
  }
}

/**
 * Calculates historical head-to-head records between two clubs for a specific derby.
 * Distinct from individual player records.
 */
export async function getClubDerbyHeadToHead(derbyId: string): Promise<ClubDerbyH2H | null> {
  try {
    await ensureDerbyTable();
    const derby = await prisma.derby.findUnique({ where: { id: derbyId } });
    if (!derby) return null;

    const c1 = resolveCanonicalClubId(derby.club1Id);
    const c2 = resolveCanonicalClubId(derby.club2Id);

    // Query active matches
    const activeMatches = await prisma.match.findMany({
      where: {
        status: { in: ["FINISHED", "FORFEIT"] },
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: true,
      },
      orderBy: { matchDate: "desc" },
    });

    // Query archived matches
    const archivedMatches = await prisma.archivedMatch.findMany({
      where: {
        status: { in: ["FINISHED", "FORFEIT"] },
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    let club1Wins = 0;
    let club2Wins = 0;
    let draws = 0;

    const historicalMatches: ClubDerbyH2H["historicalMatches"] = [];
    const seasonResults: ClubDerbyH2H["seasonResults"] = {};

    for (const m of activeMatches) {
      const hC = resolveCanonicalClubId(m.homePlayer?.realTeam);
      const aC = resolveCanonicalClubId(m.awayPlayer?.realTeam);

      const isMatch = (hC === c1 && aC === c2) || (hC === c2 && aC === c1);
      if (!isMatch) continue;

      const hS = m.homeScore ?? 0;
      const aS = m.awayScore ?? 0;
      const season = m.tournament?.season || "Season 1 (2026)";

      if (!seasonResults[season]) {
        seasonResults[season] = { club1Wins: 0, club2Wins: 0, draws: 0, total: 0 };
      }
      seasonResults[season].total += 1;

      if (hS === aS) {
        draws += 1;
        seasonResults[season].draws += 1;
      } else if (hC === c1) {
        if (hS > aS) {
          club1Wins += 1;
          seasonResults[season].club1Wins += 1;
        } else {
          club2Wins += 1;
          seasonResults[season].club2Wins += 1;
        }
      } else {
        if (hS > aS) {
          club2Wins += 1;
          seasonResults[season].club2Wins += 1;
        } else {
          club1Wins += 1;
          seasonResults[season].club1Wins += 1;
        }
      }

      historicalMatches.push({
        id: m.id,
        date: m.matchDate,
        season,
        division: m.division,
        round: m.round,
        homeClub: m.homePlayer?.realTeam || "Home Club",
        awayClub: m.awayPlayer?.realTeam || "Away Club",
        homeGamerTag: m.homePlayer.gamerTag,
        awayGamerTag: m.awayPlayer.gamerTag,
        homeScore: hS,
        awayScore: aS,
        status: m.status,
      });
    }

    for (const am of archivedMatches) {
      const isArchivedDerby = am.derbyId === derby.id || am.derbyName === derby.name;
      if (!isArchivedDerby) continue;

      const hS = am.homeScore ?? 0;
      const aS = am.awayScore ?? 0;
      const season = am.season || "Archived Season";

      if (!seasonResults[season]) {
        seasonResults[season] = { club1Wins: 0, club2Wins: 0, draws: 0, total: 0 };
      }
      seasonResults[season].total += 1;

      if (hS === aS) {
        draws += 1;
        seasonResults[season].draws += 1;
      }

      historicalMatches.push({
        id: am.id,
        date: am.matchDate || am.createdAt,
        season,
        division: am.division,
        round: am.round,
        homeClub: am.homePlayerName || derby.club1Name,
        awayClub: am.awayPlayerName || derby.club2Name,
        homeGamerTag: am.homeGamerTag,
        awayGamerTag: am.awayGamerTag,
        homeScore: hS,
        awayScore: aS,
        status: am.status,
      });
    }

    const totalMeetings = historicalMatches.length;
    const latest = historicalMatches[0];
    const latestMeeting = latest
      ? {
          matchId: latest.id,
          date: latest.date,
          homeTeam: latest.homeClub,
          awayTeam: latest.awayClub,
          homeScore: latest.homeScore,
          awayScore: latest.awayScore,
          homeGamerTag: latest.homeGamerTag,
          awayGamerTag: latest.awayGamerTag,
          season: latest.season,
          division: latest.division,
        }
      : null;

    return {
      derby,
      totalMeetings,
      club1Wins,
      club2Wins,
      draws,
      latestMeeting,
      historicalMatches,
      seasonResults,
    };
  } catch (err) {
    console.error("[getClubDerbyHeadToHead] Error:", err);
    return null;
  }
}

/**
 * Calculates a player's derby head-to-head performance against a specific opponent.
 * STRICT REQUIREMENT: Only returns matchesPlayed, wins, draws, defeats. NO win rate.
 */
export async function getPlayerDerbyOpponentH2H(
  playerId: string,
  opponentPlayerId: string,
  derbyId?: string
): Promise<PlayerDerbyStats> {
  try {
    await ensureDerbyTable();
    const activeDerbies = await getActiveDerbies();

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homePlayerId: playerId, awayPlayerId: opponentPlayerId },
          { homePlayerId: opponentPlayerId, awayPlayerId: playerId },
        ],
        status: { in: ["FINISHED", "FORFEIT"] },
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    let matchesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let defeats = 0;

    for (const m of matches) {
      const derby = m.isDerby && m.derbyName
        ? { id: m.derbyId || "", name: m.derbyName }
        : detectDerby(m.homePlayer, m.awayPlayer, activeDerbies);

      if (!derby) continue;
      if (derbyId && derby.id && derby.id !== derbyId) continue;

      matchesPlayed += 1;
      const isHome = m.homePlayerId === playerId;
      const myScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);

      if (myScore > oppScore) {
        wins += 1;
      } else if (myScore < oppScore) {
        defeats += 1;
      } else {
        draws += 1;
      }
    }

    return { matchesPlayed, wins, draws, defeats };
  } catch (err) {
    console.error("[getPlayerDerbyOpponentH2H] Error:", err);
    return { matchesPlayed: 0, wins: 0, draws: 0, defeats: 0 };
  }
}
