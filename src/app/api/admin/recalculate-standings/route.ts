import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/recalculateStandings";

import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";

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

    const body = await req.json().catch(() => ({}));
    const { division = "ALL" } = body;

    const results: any = {};
    const groups = ["Group A", "Group B", "Group C", "Group D"];

    // Recalculate Divisions
    if (division === "ALL" || division.startsWith("Division")) {
      const targetDivs = division === "ALL" ? ["Division 1", "Division 2", "Division 3"] : [division];
      for (const divName of targetDivs) {
        const tournament = await prisma.tournament.findFirst({
          where: { name: { contains: divName }, type: "DIVISION" },
        });
        if (tournament) {
          await recalculateStandings(tournament.id, divName);
          await notifyStandingsUpdate({
            tournamentType: "DIVISION",
            competitionName: divName,
            matchSummary: "Table recalculated by Commissioner",
          });
          results[divName] = "Recalculated & notified";
        }
      }
    }

    // Recalculate UCL
    if (division === "ALL" || division === "UCL" || division.startsWith("UCL")) {
      const uclTournament = await prisma.tournament.findFirst({
        where: { OR: [{ type: "UCL" }, { name: { contains: "UCL" } }] },
      });
      if (uclTournament) {
        const targetGroups = division.includes("Group")
          ? [division.replace("UCL ", "").trim()]
          : groups;
        for (const grp of targetGroups) {
          const grpKey = `UCL ${grp}`;
          await recalculateStandings(uclTournament.id, grpKey);
          await notifyStandingsUpdate({
            tournamentType: "UCL",
            competitionName: "UCL",
            groupName: grp,
            matchSummary: "Table recalculated by Commissioner",
          });
          results[grpKey] = "Recalculated & notified";
        }
      }
    }

    // Recalculate EUROPA
    if (division === "ALL" || division === "EUROPA" || division.startsWith("EUROPA")) {
      const europaTournament = await prisma.tournament.findFirst({
        where: { OR: [{ type: "EUROPA" }, { name: { contains: "EUROPA" } }] },
      });
      if (europaTournament) {
        const targetGroups = division.includes("Group")
          ? [division.replace("EUROPA ", "").trim()]
          : groups;
        for (const grp of targetGroups) {
          const grpKey = `EUROPA ${grp}`;
          await recalculateStandings(europaTournament.id, grpKey);
          await notifyStandingsUpdate({
            tournamentType: "EUROPA",
            competitionName: "EUROPA",
            groupName: grp,
            matchSummary: "Table recalculated by Commissioner",
          });
          results[grpKey] = "Recalculated & notified";
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated standings tables and notified participating players for ${division}.`,
      results,
    });
  } catch (err: any) {
    console.error("Standings recalculation error:", err);
    return NextResponse.json({ error: err.message || "Failed to recalculate standings." }, { status: 500 });
  }
}
