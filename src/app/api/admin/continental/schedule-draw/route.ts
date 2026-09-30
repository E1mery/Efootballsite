import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatRwandanDateTime } from "@/lib/rwandanTime";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, competition = "UCL", drawTime, started, slots } = body;

    // Check if competition is unlocked
    const currentLeagueConfig = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const isCompUnlocked = competition === "UCL" ? currentLeagueConfig?.uclStarted : currentLeagueConfig?.europaStarted;

    // =========================================================================
    // 1. SCHEDULE DRAW
    // =========================================================================
    if (action === "SCHEDULE_DRAW") {
      if (!isCompUnlocked) {
        return NextResponse.json(
          { error: `Cannot schedule ${competition} draw while ${competition} is locked. Please click "Unlock ${competition}" once qualification tables are concluded.` },
          { status: 400 }
        );
      }

      // If drawTime is null or empty, treat as reset schedule
      if (!drawTime) {
        const updateData: any = {};
        if (competition === "UCL") {
          updateData.uclDrawTime = null;
        } else {
          updateData.europaDrawTime = null;
        }

        const config = await prisma.leagueConfig.upsert({
          where: { id: "default" },
          update: updateData,
          create: { id: "default", ...updateData },
        });

        // Remove published news from carousel when schedule time resets
        const otherDrawTime = competition === "UCL" ? config.europaDrawTime : config.uclDrawTime;
        if (!otherDrawTime) {
          await prisma.news.updateMany({
            where: { id: "sys-announcement-draw-scheduled" },
            data: { showOnCarousel: false },
          }).catch(() => {});
        }

        // Clean up broadcast announcement
        await prisma.announcement.deleteMany({
          where: {
            type: "BROADCAST",
            title: { contains: `${competition} Official Draws Event Scheduled` },
          },
        }).catch(() => {});

        await syncSystemNewsToCarousel();

        return NextResponse.json({
          success: true,
          message: `${competition} Draw scheduled time has been reset and published announcement removed from carousel.`,
          config,
        });
      }

      const dateVal = new Date(drawTime);
      const updateData: any = {};
      if (competition === "UCL") {
        updateData.uclDrawTime = dateVal;
      } else {
        updateData.europaDrawTime = dateVal;
      }

      const config = await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: updateData,
        create: { id: "default", ...updateData },
      });

      // Clear any prior dismissal so the new schedule appears
      await prisma.$executeRawUnsafe(
        `DELETE FROM "DismissedSystemNews" WHERE "id" = 'sys-announcement-draw-scheduled'`
      ).catch(() => {});

      // Broadcast announcement about scheduled draw
      const drawDisplay = formatRwandanDateTime(dateVal);
      await prisma.announcement.create({
        data: {
          title: `🏆 ${competition} Official Draws Event Scheduled!`,
          content: `The League Commissioner has officially scheduled the live draws event for the ${competition} on ${drawDisplay} (CAT / Rwandan Time). All athletes can watch the live animated draw event on the Continental Cups page.`,
          type: "BROADCAST",
          isPinned: true,
        },
      }).catch(() => {});

      // Sync into News table for carousel and admin portal
      await syncSystemNewsToCarousel();

      return NextResponse.json({
        success: true,
        message: `${competition} Draw Event scheduled for ${formatRwandanDateTime(dateVal)} (CAT)`,
        config,
      });
    }

    // =========================================================================
    // 2. RESET SCHEDULE TIME
    // =========================================================================
    if (action === "RESET_SCHEDULE") {
      const updateData: any = {};
      if (competition === "UCL") {
        updateData.uclDrawTime = null;
      } else {
        updateData.europaDrawTime = null;
      }

      const config = await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: updateData,
        create: { id: "default", ...updateData },
      });

      // When schedule time resets, remove the published news from the carousel
      const otherDrawTime = competition === "UCL" ? config.europaDrawTime : config.uclDrawTime;
      if (!otherDrawTime) {
        await prisma.news.updateMany({
          where: { id: "sys-announcement-draw-scheduled" },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }

      // Clean up broadcast announcement
      await prisma.announcement.deleteMany({
        where: {
          type: "BROADCAST",
          title: { contains: `${competition} Official Draws Event Scheduled` },
        },
      }).catch(() => {});

      await syncSystemNewsToCarousel();

      return NextResponse.json({
        success: true,
        message: `${competition} Draw schedule time has been reset and published announcement removed from carousel.`,
        config,
      });
    }

    // =========================================================================
    // 3. LAUNCH LIVE DRAW (Commissioner triggers live broadcast for all players)
    // =========================================================================
    if (action === "LAUNCH_LIVE_DRAW") {
      const updateData: any = {};
      if (competition === "UCL") {
        updateData.uclStarted = true;
        updateData.uclDrawCompleted = false;
      } else {
        updateData.europaStarted = true;
        updateData.europaDrawCompleted = false;
      }

      const config = await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: updateData,
        create: { id: "default", ...updateData },
      });

      // Clear any unfinalized slots so draw can proceed cleanly
      await prisma.uclGroupSlot.deleteMany({
        where: { competition },
      });

      // Broadcast announcement that the live draw is officially underway
      await prisma.announcement.create({
        data: {
          title: `🔴 ${competition} LIVE ANIMATED DRAWS UNDERWAY!`,
          content: `The League Commissioner has officially initiated the live animated draw event for ${competition}! Watch the live broadcast now on your player dashboard or Continental page.`,
          type: "BROADCAST",
          isPinned: true,
        },
      }).catch(() => {});

      await syncSystemNewsToCarousel();

      return NextResponse.json({
        success: true,
        message: `Official live ${competition} draw has been launched across all player portals!`,
        config,
      });
    }

    // =========================================================================
    // 4. TOGGLE COMPETITION LOCK/UNLOCK
    // =========================================================================
    if (action === "TOGGLE_COMPETITION") {
      const updateData: any = {};
      const isNowStarted = Boolean(started);

      if (competition === "UCL") {
        updateData.uclStarted = isNowStarted;
      } else {
        updateData.europaStarted = isNowStarted;
      }

      const config = await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: updateData,
        create: { id: "default", ...updateData },
      });

      // When competition is locked (started = false), remove its news from the carousel immediately!
      if (!isNowStarted) {
        const otherUnlocked = competition === "UCL" ? config.europaStarted : config.uclStarted;

        // If the other competition is also not unlocked, disable scheduled draw news on carousel
        if (!otherUnlocked) {
          await prisma.news.updateMany({
            where: { id: "sys-announcement-draw-scheduled" },
            data: { showOnCarousel: false },
          }).catch(() => {});
          await prisma.news.updateMany({
            where: { id: "sys-announcement-draw-results" },
            data: { showOnCarousel: false },
          }).catch(() => {});
        }

        // Knockout advance requires BOTH unlocked; disable if either locked
        await prisma.news.updateMany({
          where: { id: "sys-announcement-both-advance" },
          data: { showOnCarousel: false },
        }).catch(() => {});

        // Deactivate any manual or custom news mentioning this locked competition
        const compKeyword = competition === "UCL" ? "Champions League" : "Europa League";
        const shortKeyword = competition === "UCL" ? "UCL" : "Europa";
        await prisma.news.updateMany({
          where: {
            OR: [
              { title: { contains: compKeyword, mode: "insensitive" } },
              { title: { contains: shortKeyword, mode: "insensitive" } },
            ],
            category: { in: ["Competition", "Announcement"] },
          },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }

      await syncSystemNewsToCarousel();

      return NextResponse.json({
        success: true,
        message: `${competition} is now ${started ? "UNLOCKED" : "LOCKED"}.`,
        config,
      });
    }

    // =========================================================================
    // 5. COMMIT OFFICIAL ANIMATED DRAW SLOTS
    // =========================================================================
    if (action === "COMMIT_DRAW") {
      if (!Array.isArray(slots) || slots.length === 0) {
        return NextResponse.json(
          { error: "No group slots provided to commit." },
          { status: 400 }
        );
      }

      // Verify division constraint: no more than 2 players from the same division in any group!
      const groupDivisions: Record<string, Record<string, number>> = {};
      for (const slot of slots) {
        const grp = slot.groupName;
        const div = slot.playerDivision;
        if (!groupDivisions[grp]) groupDivisions[grp] = {};
        groupDivisions[grp][div] = (groupDivisions[grp][div] || 0) + 1;
        const maxPerDiv = div === "Division 1" ? 2 : 1;
        if (groupDivisions[grp][div] > maxPerDiv) {
          return NextResponse.json(
            {
              error: `Invalid Draw: ${grp} contains ${groupDivisions[grp][div]} players from ${div}. Strict rule: no more than ${maxPerDiv} player(s) from ${div} per group in ${competition}!`,
            },
            { status: 400 }
          );
        }
      }

      // Clear existing slots for this competition
      await prisma.uclGroupSlot.deleteMany({
        where: { competition },
      });

      // Insert all slots
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        await prisma.uclGroupSlot.create({
          data: {
            competition,
            groupName: s.groupName,
            playerId: s.playerId,
            playerDivision: s.playerDivision,
            slotIndex: s.slotIndex || i + 1,
          },
        });
      }

      // Mark draw completed in LeagueConfig
      const updateConfig: any = {};
      if (competition === "UCL") {
        updateConfig.uclDrawCompleted = true;
        updateConfig.uclStarted = true;
      } else {
        updateConfig.europaDrawCompleted = true;
        updateConfig.europaStarted = true;
      }
      await prisma.leagueConfig.update({
        where: { id: "default" },
        data: updateConfig,
      });

      // Draw concluded -> Clear draw-results dismissal if previously dismissed
      await prisma.$executeRawUnsafe(
        `DELETE FROM "DismissedSystemNews" WHERE "id" = 'sys-announcement-draw-results'`
      ).catch(() => {});

      // Broadcast announcement
      await prisma.announcement.create({
        data: {
          title: `🎉 ${competition} Official Group Draws Concluded!`,
          content: `The official live animated draws for ${competition} have concluded! All 4 groups (A, B, C, D) are locked with strict division separation. Check the Continental Cups page to see your group opponents.`,
          type: "BROADCAST",
          isPinned: true,
        },
      }).catch(() => {});

      // Synchronize results to News table & carousel
      await syncSystemNewsToCarousel();

      return NextResponse.json({
        success: true,
        message: `Successfully committed official ${competition} group draw!`,
      });
    }

    // =========================================================================
    // 6. RESET DRAW
    // =========================================================================
    if (action === "RESET_DRAW") {
      await prisma.uclGroupSlot.deleteMany({
        where: { competition },
      });

      const resetData: any = {};
      if (competition === "UCL") {
        resetData.uclDrawCompleted = false;
        resetData.uclDrawTime = null; // Wipe scheduled draw time!
      } else {
        resetData.europaDrawCompleted = false;
        resetData.europaDrawTime = null; // Wipe scheduled draw time!
      }

      const updatedConfig = await prisma.leagueConfig.update({
        where: { id: "default" },
        data: resetData,
      });

      // Remove published news from the carousel
      const otherDrawDone = competition === "UCL" ? updatedConfig.europaDrawCompleted : updatedConfig.uclDrawCompleted;
      if (!otherDrawDone) {
        await prisma.news.updateMany({
          where: { id: "sys-announcement-draw-results" },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }

      const otherScheduled = competition === "UCL" ? Boolean(updatedConfig.europaDrawTime) : Boolean(updatedConfig.uclDrawTime);
      if (!otherScheduled) {
        await prisma.news.updateMany({
          where: { id: "sys-announcement-draw-scheduled" },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }

      // Clean up broadcast announcements for this draw
      await prisma.announcement.deleteMany({
        where: {
          type: "BROADCAST",
          OR: [
            { title: { contains: `${competition} Official Draws Event Scheduled` } },
            { title: { contains: `${competition} Official Group Draws Concluded` } },
          ],
        },
      }).catch(() => {});

      await syncSystemNewsToCarousel();

      return NextResponse.json({
        success: true,
        message: `${competition} draw and scheduled time have been reset. Published carousel announcements removed.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("Schedule draw error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process draw action." },
      { status: 500 }
    );
  }
}
