/**
 * Rwanda eFootball League — Automatic Event Detection Engine
 * Scans real database records (matches, draws, standings, config, hall of fame)
 * to identify supported events awaiting social publication.
 * STRICT: ZERO mock or demo data. Only verified database state is surfaced.
 */

import { prisma } from "@/lib/prisma";
import { formatRwandanDate, formatRwandanTime, formatRwandanDateTime } from "@/lib/rwandanTime";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import { resolveSocialBackground } from "./socialBackgroundEngine";
import { DetectedSystemEvent, decodePostCaption } from "./socialFeedTypes";

export async function detectPendingSystemEvents(): Promise<DetectedSystemEvent[]> {
  const events: DetectedSystemEvent[] = [];

  try {
    const [config, existingPosts] = await Promise.all([
      prisma.leagueConfig.findUnique({ where: { id: "default" } }),
      prisma.socialPost.findMany({
        select: {
          id: true,
          type: true,
          matchId: true,
          season: true,
          division: true,
          caption: true,
          status: true,
        },
      }),
    ]);

    const activeSeason = config?.season || "Season 1 (2026)";

    // Set of unique keys already processed or published
    const existingKeys = new Set<string>();
    existingPosts.forEach((p) => {
      if (p.matchId) {
        existingKeys.add(`${p.type}_${p.matchId}`);
      }
      const { data } = decodePostCaption(p.caption);
      if (data?.eventKey) {
        existingKeys.add(data.eventKey);
      }
      // General type + division/season key
      existingKeys.add(`${p.type}_${p.division || ""}_${p.season || ""}`);
    });

    // =========================================================================
    // 1. COMPETITION DRAWS: SCHEDULED DRAW ANNOUNCEMENTS
    // =========================================================================
    if (config?.uclDrawTime) {
      const eventKey = `DRAW_ANNOUNCEMENT_UCL_${activeSeason}`;
      if (!existingKeys.has(eventKey)) {
        const bg = resolveSocialBackground({ category: "COMPETITION_DRAWS", type: "UCL_DRAW_ANNOUNCEMENT", competition: "UCL" });
        events.push({
          id: `detected-${eventKey}`,
          eventKey,
          category: "COMPETITION_DRAWS",
          type: "UCL_DRAW_ANNOUNCEMENT",
          title: `UEFA Champions League Live Draw Announcement`,
          description: `Commissioner has scheduled the official live UCL draw for ${formatRwandanDateTime(config.uclDrawTime)} CAT.`,
          defaultBackgroundKey: bg.id,
          division: "UCL",
          season: activeSeason,
          isReadyForPublish: true,
          requiresReview: false,
          metadata: {
            category: "COMPETITION_DRAWS",
            backgroundKey: bg.imagePath,
            bannerTitle: "UEFA CHAMPIONS LEAGUE",
            subtitle: "OFFICIAL GROUP STAGE DRAW EVENT",
            badgeLabel: "Live Draw Event",
            badgeVariant: "yellow",
            kickoffDate: formatRwandanDate(config.uclDrawTime),
            kickoffTime: formatRwandanTime(config.uclDrawTime),
            trophyAsset: "/assets/trophies/champions-league.png",
            eventKey,
          },
        });
      }
    }

    if (config?.europaDrawTime) {
      const eventKey = `DRAW_ANNOUNCEMENT_EUROPA_${activeSeason}`;
      if (!existingKeys.has(eventKey)) {
        const bg = resolveSocialBackground({ category: "COMPETITION_DRAWS", type: "EUROPA_DRAW_ANNOUNCEMENT", competition: "EUROPA" });
        events.push({
          id: `detected-${eventKey}`,
          eventKey,
          category: "COMPETITION_DRAWS",
          type: "EUROPA_DRAW_ANNOUNCEMENT",
          title: `UEFA Europa League Live Draw Announcement`,
          description: `Commissioner has scheduled the official live Europa League draw for ${formatRwandanDateTime(config.europaDrawTime)} CAT.`,
          defaultBackgroundKey: bg.id,
          division: "EUROPA",
          season: activeSeason,
          isReadyForPublish: true,
          requiresReview: false,
          metadata: {
            category: "COMPETITION_DRAWS",
            backgroundKey: bg.imagePath,
            bannerTitle: "UEFA EUROPA LEAGUE",
            subtitle: "OFFICIAL GROUP STAGE DRAW EVENT",
            badgeLabel: "Live Draw Event",
            badgeVariant: "yellow",
            kickoffDate: formatRwandanDate(config.europaDrawTime),
            kickoffTime: formatRwandanTime(config.europaDrawTime),
            trophyAsset: "/assets/trophies/europa-league.png",
            eventKey,
          },
        });
      }
    }

    // =========================================================================
    // 2. COMPETITION DRAWS: CONFIRMED GROUP DRAW RESULTS
    // =========================================================================
    for (const comp of ["UCL", "EUROPA"] as const) {
      const isCompleted = comp === "UCL" ? config?.uclDrawCompleted : config?.europaDrawCompleted;
      if (isCompleted) {
        const eventKey = `GROUP_DRAW_RESULTS_${comp}_${activeSeason}`;
        if (!existingKeys.has(eventKey)) {
          const slots = await prisma.uclGroupSlot.findMany({
            where: { competition: comp },
            include: { player: true },
            orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
          });

          if (slots.length > 0) {
            const groupsMap: Record<string, any[]> = { "Group A": [], "Group B": [], "Group C": [], "Group D": [] };
            slots.forEach((s) => {
              if (!groupsMap[s.groupName]) groupsMap[s.groupName] = [];
              groupsMap[s.groupName].push({
                gamerTag: s.player.gamerTag,
                realTeam: s.player.realTeam,
                avatar: resolvePlayerAvatar(s.player),
                division: s.playerDivision,
              });
            });

            const groups = Object.entries(groupsMap).map(([groupName, groupSlots]) => ({
              groupName,
              slots: groupSlots,
            }));

            const bg = resolveSocialBackground({ category: "COMPETITION_DRAWS", type: "CONFIRMED_GROUP_DRAW_RESULTS", competition: comp });
            events.push({
              id: `detected-${eventKey}`,
              eventKey,
              category: "COMPETITION_DRAWS",
              type: "CONFIRMED_GROUP_DRAW_RESULTS",
              title: `${comp === "UCL" ? "Champions League" : "Europa League"} Confirmed Group Draw Results`,
              description: `All 4 groups confirmed with strict division constraints across 16 qualified athletes.`,
              defaultBackgroundKey: bg.id,
              division: comp,
              season: activeSeason,
              isReadyForPublish: true,
              requiresReview: false,
              metadata: {
                category: "COMPETITION_DRAWS",
                backgroundKey: bg.imagePath,
                bannerTitle: comp === "UCL" ? "UEFA CHAMPIONS LEAGUE" : "UEFA EUROPA LEAGUE",
                subtitle: "CONFIRMED GROUP STAGE DRAW RESULTS",
                badgeLabel: "Official Groups",
                badgeVariant: "yellow",
                trophyAsset: comp === "UCL" ? "/assets/trophies/champions-league.png" : "/assets/trophies/europa-league.png",
                groups,
                eventKey,
              },
            });
          }
        }
      }
    }

    // =========================================================================
    // 3. SEASON ACTIVITIES: OFFICIAL KICKOFF ANNOUNCEMENT
    // =========================================================================
    const kickoffKey = `SEASON_KICKOFF_${activeSeason}`;
    if (!existingKeys.has(kickoffKey)) {
      const bg = resolveSocialBackground({ category: "SEASON_ACTIVITIES", type: "SEASON_KICKOFF_ANNOUNCEMENT" });
      events.push({
        id: `detected-${kickoffKey}`,
        eventKey: kickoffKey,
        category: "SEASON_ACTIVITIES",
        type: "SEASON_KICKOFF_ANNOUNCEMENT",
        title: `${activeSeason} Official Season Kickoff`,
        description: `Official campaign launch across Division 1, Division 2, and Division 3.`,
        defaultBackgroundKey: bg.id,
        season: activeSeason,
        isReadyForPublish: true,
        requiresReview: false,
        metadata: {
          category: "SEASON_ACTIVITIES",
          backgroundKey: bg.imagePath,
          bannerTitle: activeSeason.toUpperCase(),
          subtitle: "OFFICIAL LEAGUE CAMPAIGN KICKOFF",
          badgeLabel: "Season Kickoff",
          badgeVariant: "yellow",
          trophyAsset: "/assets/trophies/league.png",
          eventKey: kickoffKey,
        },
      });
    }

    // =========================================================================
    // 4. MATCHES: MATCH OF THE DAY & MATCH OF THE WEEK (PREVIEWS & RESULTS)
    // =========================================================================
    const pendingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { isMatchOfTheDay: true },
          { isDerby: true },
          { stage: "FINAL" },
          { round: { contains: "Final", mode: "insensitive" } },
        ],
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
      orderBy: { matchDate: "desc" },
      take: 20,
    });

    for (const match of pendingMatches) {
      const isFinished = match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null;
      const isSuperCup = match.division === "SUPER_CUP" || match.round.includes("Super Cup");
      const isUclFinal = match.division === "UCL" && (match.stage === "FINAL" || match.round.includes("Final"));
      const isEuropaFinal = match.division === "EUROPA" && (match.stage === "FINAL" || match.round.includes("Final"));

      // Determine announcement type & key
      let announceType: any = null;
      let resultType: any = null;
      let badgeLabel = "Official Fixture";

      if (isSuperCup) {
        announceType = "SUPER_CUP_ANNOUNCEMENT";
        resultType = "SUPER_CUP_RESULT";
        badgeLabel = "Super Cup Final";
      } else if (isUclFinal) {
        announceType = "UCL_FINAL_ANNOUNCEMENT";
        resultType = "UCL_FINAL_RESULT";
        badgeLabel = "UCL Grand Final";
      } else if (isEuropaFinal) {
        announceType = "EUROPA_FINAL_ANNOUNCEMENT";
        resultType = "EUROPA_FINAL_RESULT";
        badgeLabel = "Europa Grand Final";
      } else if (match.isMatchOfTheDay) {
        announceType = "MOTD_ANNOUNCEMENT";
        resultType = "MOTD_RESULT";
        badgeLabel = "Match of the Day";
      }

      // Check Announcement
      if (announceType) {
        const announceKey = `${announceType}_${match.id}`;
        if (!existingKeys.has(announceKey)) {
          const bg = resolveSocialBackground({ category: "MATCHES_RESULTS", type: announceType, division: match.division, round: match.round });
          events.push({
            id: `detected-${announceKey}`,
            eventKey: announceKey,
            category: "MATCHES_RESULTS",
            type: announceType,
            title: `${badgeLabel}: ${match.homePlayer.gamerTag} vs ${match.awayPlayer.gamerTag}`,
            description: `Scheduled for ${formatRwandanDateTime(match.matchDate)} CAT in ${match.division}.`,
            defaultBackgroundKey: bg.id,
            division: match.division,
            season: activeSeason,
            matchId: match.id,
            isReadyForPublish: true,
            requiresReview: false,
            metadata: {
              category: "MATCHES_RESULTS",
              backgroundKey: bg.imagePath,
              bannerTitle: badgeLabel.toUpperCase(),
              subtitle: match.round.toUpperCase(),
              badgeLabel,
              badgeVariant: "yellow",
              kickoffDate: formatRwandanDate(match.matchDate),
              kickoffTime: formatRwandanTime(match.matchDate),
              homeGamerTag: match.homePlayer.gamerTag,
              awayGamerTag: match.awayPlayer.gamerTag,
              homeTeamName: match.homePlayer.realTeam || undefined,
              awayTeamName: match.awayPlayer.realTeam || undefined,
              homeLogo: resolvePlayerAvatar(match.homePlayer),
              awayLogo: resolvePlayerAvatar(match.awayPlayer),
              isConfirmedResult: false,
              trophyAsset: isSuperCup
                ? "/assets/trophies/super-cup.png"
                : isUclFinal
                ? "/assets/trophies/champions-league.png"
                : isEuropaFinal
                ? "/assets/trophies/europa-league.png"
                : undefined,
              eventKey: announceKey,
            },
          });
        }
      }

      // Check Full-Time Result (Only if completed with verified score!)
      if (isFinished && resultType) {
        const resKey = `${resultType}_${match.id}`;
        if (!existingKeys.has(resKey)) {
          const hScore = match.homeScore ?? 0;
          const aScore = match.awayScore ?? 0;
          const winnerTag = hScore > aScore ? match.homePlayer.gamerTag : aScore > hScore ? match.awayPlayer.gamerTag : undefined;
          const winnerTeam = hScore > aScore ? match.homePlayer.realTeam : aScore > hScore ? match.awayPlayer.realTeam : undefined;

          const bg = resolveSocialBackground({ category: "MATCHES_RESULTS", type: resultType, division: match.division, round: match.round, isResult: true });
          events.push({
            id: `detected-${resKey}`,
            eventKey: resKey,
            category: "MATCHES_RESULTS",
            type: resultType,
            title: `Confirmed Full-Time: ${match.homePlayer.gamerTag} ${hScore} - ${aScore} ${match.awayPlayer.gamerTag}`,
            description: `Verified score officially concluded in ${match.division}.`,
            defaultBackgroundKey: bg.id,
            division: match.division,
            season: activeSeason,
            matchId: match.id,
            isReadyForPublish: true,
            requiresReview: false,
            metadata: {
              category: "MATCHES_RESULTS",
              backgroundKey: bg.imagePath,
              bannerTitle: isSuperCup ? "SUPER CUP CHAMPIONS" : isUclFinal ? "UCL CHAMPIONS" : isEuropaFinal ? "EUROPA CHAMPIONS" : "FULL TIME RESULT",
              subtitle: "OFFICIAL LEAGUE SCORELINE",
              badgeLabel: "Full Time",
              badgeVariant: "destructive",
              homeGamerTag: match.homePlayer.gamerTag,
              awayGamerTag: match.awayPlayer.gamerTag,
              homeTeamName: match.homePlayer.realTeam || undefined,
              awayTeamName: match.awayPlayer.realTeam || undefined,
              homeLogo: resolvePlayerAvatar(match.homePlayer),
              awayLogo: resolvePlayerAvatar(match.awayPlayer),
              homeScore: hScore,
              awayScore: aScore,
              winnerGamerTag: winnerTag,
              winnerTeamName: winnerTeam || undefined,
              isConfirmedResult: true,
              trophyAsset: isSuperCup
                ? "/assets/trophies/super-cup.png"
                : isUclFinal
                ? "/assets/trophies/champions-league.png"
                : isEuropaFinal
                ? "/assets/trophies/europa-league.png"
                : undefined,
              eventKey: resKey,
            },
          });
        }
      }
    }

    // =========================================================================
    // 5. STANDINGS: D1, D2, D3 STANDINGS TABLES
    // =========================================================================
    for (const division of ["Division 1", "Division 2", "Division 3"] as const) {
      const standingsKey = `STANDINGS_${division.replace(/\s+/g, "_")}_${activeSeason}`;
      if (!existingKeys.has(standingsKey)) {
        const topStandings = await prisma.standing.findMany({
          where: { division },
          include: { player: true },
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
          take: 8,
        });

        if (topStandings.length > 0) {
          const bg = resolveSocialBackground({ category: "STANDINGS_STATS", division });
          const rows = topStandings.map((s, idx) => {
            const movement: "UP" | "DOWN" | "SAME" = s.previousRank
              ? s.previousRank > idx + 1
                ? "UP"
                : s.previousRank < idx + 1
                ? "DOWN"
                : "SAME"
              : "SAME";

            return {
              rank: idx + 1,
              gamerTag: s.player.gamerTag,
              realTeam: s.player.realTeam,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              points: s.points,
              goalDifference: s.goalDifference,
              movement,
            };
          });

          events.push({
            id: `detected-${standingsKey}`,
            eventKey: standingsKey,
            category: "STANDINGS_STATS",
            type: division === "Division 1" ? "STANDINGS_UPDATE_D1" : division === "Division 2" ? "STANDINGS_UPDATE_D2" : "STANDINGS_UPDATE_D3",
            title: `${division} Official Standings Update`,
            description: `Current verified league table with top ${rows.length} contenders.`,
            defaultBackgroundKey: bg.id,
            division,
            season: activeSeason,
            isReadyForPublish: true,
            requiresReview: true, // Review by default per requirement 8
            metadata: {
              category: "STANDINGS_STATS",
              backgroundKey: bg.imagePath,
              bannerTitle: `${division.toUpperCase()} STANDINGS`,
              subtitle: "OFFICIAL LEAGUE TABLE",
              badgeLabel: "Standings",
              badgeVariant: "yellow",
              standingsRows: rows,
              trophyAsset: division === "Division 1" ? "/assets/trophies/league.png" : division === "Division 2" ? "/assets/trophies/d2.png" : "/assets/trophies/d3.png",
              eventKey: standingsKey,
            },
          });
        }
      }
    }

    // =========================================================================
    // 6. CONFIRMED CHAMPIONS: HALL OF FAME INDUCTEES
    // =========================================================================
    const hallOfFameRecords = await prisma.hallOfFame.findMany({
      where: { isInducted: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const record of hallOfFameRecords) {
      const champKey = `CHAMPION_${record.tournamentName.replace(/\s+/g, "_")}_${record.season.replace(/\s+/g, "_")}`;
      if (!existingKeys.has(champKey)) {
        const bg = resolveSocialBackground({ category: "SEASON_ACTIVITIES", type: "CONFIRMED_CHAMPIONS" });
        events.push({
          id: `detected-${champKey}`,
          eventKey: champKey,
          category: "SEASON_ACTIVITIES",
          type: "CONFIRMED_CHAMPIONS",
          title: `Confirmed Champion: ${record.championName} (${record.tournamentName})`,
          description: `Officially inducted into the Rwanda eFootball League Hall of Fame.`,
          defaultBackgroundKey: bg.id,
          season: record.season,
          isReadyForPublish: true,
          requiresReview: false,
          metadata: {
            category: "SEASON_ACTIVITIES",
            backgroundKey: bg.imagePath,
            bannerTitle: "OFFICIAL CHAMPION CROWNED",
            subtitle: record.tournamentName.toUpperCase(),
            badgeLabel: "Champion",
            badgeVariant: "yellow",
            winnerGamerTag: record.championName,
            trophyAsset: record.trophyType === "UCL"
              ? "/assets/trophies/champions-league.png"
              : record.trophyType === "EUROPA"
              ? "/assets/trophies/europa-league.png"
              : "/assets/trophies/league.png",
            eventKey: champKey,
          },
        });
      }
    }

    return events;
  } catch (err) {
    console.error("[detectPendingSystemEvents] Error scanning real system records:", err);
    return [];
  }
}
