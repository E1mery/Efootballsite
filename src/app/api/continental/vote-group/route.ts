import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "UCL";

    const slots = await prisma.uclGroupSlot.findMany({
      where: { competition },
      include: {
        player: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            division: true,
            whatsapp: true,
            efootballId: true,
            overallRating: true,
          },
        },
      },
      orderBy: [{ groupName: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ slots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Please log in to vote for your group." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User session invalid." }, { status: 401 });
    }

    const body = await req.json();
    const { competition = "UCL", groupName, action = "VOTE", targetPlayerId } = body;

    // Check if competition is started by Admin
    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const isStarted = competition === "UCL" ? config?.uclStarted : config?.europaStarted;
    if (!isStarted && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: `${competition} is currently locked by the League Administrator. Group selection will open once authorized.`,
        },
        { status: 403 }
      );
    }

    // --- ADMIN ACTION: AUTO DRAW WITH DIVISION SEPARATION ---
    if (action === "AUTO_DRAW") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only Admin can conduct automated group draw." }, { status: 403 });
      }

      // Clear existing slots for this competition
      await prisma.uclGroupSlot.deleteMany({ where: { competition } });

      const groups = ["Group A", "Group B", "Group C", "Group D"];

      if (competition === "UCL") {
        // Fetch Top 8 Div 1, Top 4 Div 2, Top 4 Div 3
        const [div1, div2, div3] = await Promise.all([
          prisma.standing.findMany({
            where: { division: "Division 1" },
            include: { player: true },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
            take: 8,
          }),
          prisma.standing.findMany({
            where: { division: "Division 2" },
            include: { player: true },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
            take: 4,
          }),
          prisma.standing.findMany({
            where: { division: "Division 3" },
            include: { player: true },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
            take: 4,
          }),
        ]);

        // Place 1 Div 2 into each group
        for (let i = 0; i < 4; i++) {
          if (div2[i]) {
            await prisma.uclGroupSlot.create({
              data: {
                competition: "UCL",
                groupName: groups[i],
                playerId: div2[i].playerId,
                playerDivision: "Division 2",
                slotIndex: 1,
              },
            });
          }
        }

        // Place 1 Div 3 into each group
        for (let i = 0; i < 4; i++) {
          if (div3[i]) {
            await prisma.uclGroupSlot.create({
              data: {
                competition: "UCL",
                groupName: groups[i],
                playerId: div3[i].playerId,
                playerDivision: "Division 3",
                slotIndex: 2,
              },
            });
          }
        }

        // Place 2 Div 1 into each group
        for (let i = 0; i < 8; i++) {
          if (div1[i]) {
            const groupIdx = i % 4;
            const slotIdx = i < 4 ? 3 : 4;
            await prisma.uclGroupSlot.create({
              data: {
                competition: "UCL",
                groupName: groups[groupIdx],
                playerId: div1[i].playerId,
                playerDivision: "Division 1",
                slotIndex: slotIdx,
              },
            });
          }
        }
      } else {
        // Europa League Draw
        const [div1E, div2E, div3E] = await Promise.all([
          prisma.standing.findMany({
            where: { division: "Division 1" },
            include: { player: true },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
            skip: 8,
            take: 4,
          }),
          prisma.standing.findMany({
            where: { division: "Division 2" },
            include: { player: true },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
            skip: 4,
            take: 4,
          }),
          prisma.standing.findMany({
            where: { division: "Division 3" },
            include: { player: true },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
            skip: 4,
            take: 4,
          }),
        ]);

        // 1 Div 1 in each group (Groups A, B, C, D)
        for (let i = 0; i < 4; i++) {
          if (div1E[i]) {
            await prisma.uclGroupSlot.create({
              data: {
                competition: "EUROPA",
                groupName: groups[i],
                playerId: div1E[i].playerId,
                playerDivision: "Division 1",
                slotIndex: 1,
              },
            });
          }
        }

        // 1 Div 2 in each group (Groups A, B, C, D)
        for (let i = 0; i < 4; i++) {
          if (div2E[i]) {
            await prisma.uclGroupSlot.create({
              data: {
                competition: "EUROPA",
                groupName: groups[i],
                playerId: div2E[i].playerId,
                playerDivision: "Division 2",
                slotIndex: 2,
              },
            });
          }
        }

        // 1 Div 3 in each group (Groups A, B, C, D)
        for (let i = 0; i < 4; i++) {
          if (div3E[i]) {
            await prisma.uclGroupSlot.create({
              data: {
                competition: "EUROPA",
                groupName: groups[i],
                playerId: div3E[i].playerId,
                playerDivision: "Division 3",
                slotIndex: 3,
              },
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully conducted official seeded draw for ${competition} with complete division separation!`,
      });
    }

    // --- PLAYER GROUP VOTE / SLOT SELECTION ---
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Manual group voting has been discontinued. Groups are now officially assigned via the scheduled Live Animated Draws Event!",
        },
        { status: 403 }
      );
    }

    const votingPlayerId = targetPlayerId;
    if (!votingPlayerId) {
      return NextResponse.json({ error: "Target player ID required for admin slotting." }, { status: 400 });
    }

    const votingPlayer = await prisma.player.findUnique({
      where: { id: votingPlayerId },
    });

    if (!votingPlayer) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    if (!groupName || !["Group A", "Group B", "Group C", "Group D"].includes(groupName)) {
      return NextResponse.json({ error: "Invalid group selected. Choose Group A, B, C, or D." }, { status: 400 });
    }

    // Get current players in the target group
    const existingInGroup = await prisma.uclGroupSlot.findMany({
      where: { competition, groupName },
      include: { player: true },
    });

    // Check capacity: max 4 for UCL, max 3 for Europa
    const maxCapacity = competition === "UCL" ? 4 : 3;
    if (existingInGroup.length >= maxCapacity) {
      return NextResponse.json(
        { error: `${groupName} is already full (${maxCapacity}/${maxCapacity} players). Please pick an available group.` },
        { status: 400 }
      );
    }

    // ENFORCE STRICT DIVISION SEPARATION:
    // In UCL: max 2 from same division. In Europa: max 1 from same division.
    const sameDivisionPlayers = existingInGroup.filter(
      (slot) => slot.playerDivision === votingPlayer.division
    );

    const maxSameDivision = competition === "UCL" ? 2 : 1;
    if (sameDivisionPlayers.length >= maxSameDivision) {
      const existingNames = sameDivisionPlayers.map((s) => s.player?.gamerTag || "player").join(" and ");
      return NextResponse.json(
        {
          error: `Group Allocation Rule: ${groupName} already contains ${sameDivisionPlayers.length} athlete(s) from ${votingPlayer.division} (${existingNames}). League regulations state maximum ${maxSameDivision} player(s) from the same division in this competition!`,
        },
        { status: 400 }
      );
    }

    // Save vote/slot
    const slot = await prisma.uclGroupSlot.upsert({
      where: {
        competition_playerId: {
          competition,
          playerId: votingPlayer.id,
        },
      },
      update: {
        groupName,
        playerDivision: votingPlayer.division,
      },
      create: {
        competition,
        groupName,
        playerId: votingPlayer.id,
        playerDivision: votingPlayer.division,
        slotIndex: existingInGroup.length + 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Confirmed! ${votingPlayer.gamerTag} has joined ${groupName} for ${competition} with verified division clearance.`,
      slot,
    });
  } catch (err: any) {
    console.error("Group vote error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
