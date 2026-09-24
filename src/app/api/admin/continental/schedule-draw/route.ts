import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

    // 1. SCHEDULE DRAW
    if (action === "SCHEDULE_DRAW") {
      if (!isCompUnlocked) {
        return NextResponse.json(
          { error: `Cannot schedule ${competition} draw while ${competition} is locked. Please click "Unlock ${competition}" once qualification tables are concluded.` },
          { status: 400 }
        );
      }

      const updateData: any = {};
      const dateVal = drawTime ? new Date(drawTime) : null;

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

      // Broadcast announcement about scheduled draw
      if (dateVal) {
        await prisma.announcement.create({
          data: {
            title: `🏆 ${competition} Official Draws Event Scheduled!`,
            content: `The League Commissioner has officially scheduled the live draws event for the ${competition} on ${dateVal.toLocaleDateString()} at ${dateVal.toLocaleTimeString()}. All athletes can watch the live animated draw event on the Continental Cups page.`,
            type: "BROADCAST",
            isPinned: true,
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `${competition} Draw Event scheduled for ${dateVal ? dateVal.toLocaleString() : "TBD"}`,
        config,
      });
    }

    // 2. LAUNCH LIVE DRAW (Commissioner triggers live broadcast for all players)
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

      return NextResponse.json({
        success: true,
        message: `Official live ${competition} draw has been launched across all player portals!`,
        config,
      });
    }

    // 3. TOGGLE COMPETITION LOCK/UNLOCK
    if (action === "TOGGLE_COMPETITION") {
      const updateData: any = {};
      if (competition === "UCL") {
        updateData.uclStarted = Boolean(started);
      } else {
        updateData.europaStarted = Boolean(started);
      }

      const config = await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: updateData,
        create: { id: "default", ...updateData },
      });

      return NextResponse.json({
        success: true,
        message: `${competition} is now ${started ? "UNLOCKED" : "LOCKED"}.`,
        config,
      });
    }

    // 3. COMMIT OFFICIAL ANIMATED DRAW SLOTS
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
        if (groupDivisions[grp][div] > 2) {
          return NextResponse.json(
            {
              error: `Invalid Draw: ${grp} contains ${groupDivisions[grp][div]} players from ${div}. Strict rule: no more than 2 players from the same division per group!`,
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

      // Broadcast announcement
      await prisma.announcement.create({
        data: {
          title: `🎉 ${competition} Official Group Draws Concluded!`,
          content: `The official live animated draws for ${competition} have concluded! All 4 groups (A, B, C, D) are locked with strict division separation. Check the Continental Cups page to see your group opponents.`,
          type: "BROADCAST",
          isPinned: true,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Successfully committed official ${competition} group draw!`,
      });
    }

    // 4. RESET DRAW
    if (action === "RESET_DRAW") {
      await prisma.uclGroupSlot.deleteMany({
        where: { competition },
      });

      const resetData: any = {};
      if (competition === "UCL") {
        resetData.uclDrawCompleted = false;
      } else {
        resetData.europaDrawCompleted = false;
      }

      await prisma.leagueConfig.update({
        where: { id: "default" },
        data: resetData,
      });

      return NextResponse.json({
        success: true,
        message: `${competition} draw has been reset.`,
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
