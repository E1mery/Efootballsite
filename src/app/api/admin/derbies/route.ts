import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ensureDerbyTable,
  getAllDerbies,
  resolveCanonicalClubId,
  detectDerby,
  areBothClubsAvailableInLeague,
} from "@/lib/derbyService";
import { findTeam } from "@/lib/teams";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Forbidden. Admin access required.", status: 403 };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureDerbyTable();
    const derbies = await getAllDerbies();

    // Query active matches and count recognized derbies
    const allMatches = await prisma.match.findMany({
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    const enrichedDerbies = derbies.map((d) => {
      const c1 = resolveCanonicalClubId(d.club1Id);
      const c2 = resolveCanonicalClubId(d.club2Id);

      const matchingMatches = allMatches.filter((m) => {
        const hC = resolveCanonicalClubId(m.homePlayer?.realTeam);
        const aC = resolveCanonicalClubId(m.awayPlayer?.realTeam);
        return (hC === c1 && aC === c2) || (hC === c2 && aC === c1);
      });

      const bothClubsAvailable = areBothClubsAvailableInLeague(d.club1Id, d.club2Id);

      return {
        ...d,
        matchedFixturesCount: matchingMatches.length,
        bothClubsAvailable,
      };
    });

    return NextResponse.json({
      success: true,
      derbies: enrichedDerbies,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/derbies] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load derby configurations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureDerbyTable();
    const body = await req.json();

    const {
      name,
      shortName,
      club1Id,
      club2Id,
      competition,
      description,
      imageUrl,
      isHistoricRivalry,
      priority,
      isActive,
      autoPublishSocial,
      autoPublishCarousel,
    } = body;

    // 1. Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Derby name is required." }, { status: 400 });
    }

    if (!club1Id || !club2Id) {
      return NextResponse.json(
        { error: "Both participating clubs must be selected." },
        { status: 400 }
      );
    }

    const c1Canonical = resolveCanonicalClubId(club1Id);
    const c2Canonical = resolveCanonicalClubId(club2Id);

    if (!c1Canonical || !c2Canonical || c1Canonical === c2Canonical) {
      return NextResponse.json(
        { error: "Participating clubs must be two distinct registered teams." },
        { status: 400 }
      );
    }

    // Check duplicate name
    const existingName = await prisma.derby.findFirst({
      where: { name: { equals: name.trim() } },
    });
    if (existingName) {
      return NextResponse.json(
        { error: `A derby with the name "${name.trim()}" already exists.` },
        { status: 400 }
      );
    }

    // Check duplicate team pair among active derbies
    const existingPair = await prisma.derby.findFirst({
      where: {
        OR: [
          { club1Id: c1Canonical, club2Id: c2Canonical },
          { club1Id: c2Canonical, club2Id: c1Canonical },
        ],
      },
    });
    if (existingPair) {
      return NextResponse.json(
        {
          error: `A rivalry configuration already exists for this pair of clubs (${existingPair.name}).`,
        },
        { status: 400 }
      );
    }

    const team1 = findTeam(c1Canonical);
    const team2 = findTeam(c2Canonical);

    const club1Name = team1?.name || club1Id;
    const club2Name = team2?.name || club2Id;

    const newDerby = await prisma.derby.create({
      data: {
        name: name.trim(),
        shortName: shortName?.trim() || name.trim(),
        club1Id: c1Canonical,
        club2Id: c2Canonical,
        club1Name,
        club2Name,
        competition: competition?.trim() || team1?.league || null,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || "/images/motw-stadium-bg.jpg",
        isHistoricRivalry: Boolean(isHistoricRivalry),
        priority: typeof priority === "number" ? priority : 10,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        autoPublishSocial: Boolean(autoPublishSocial),
        autoPublishCarousel: Boolean(autoPublishCarousel),
      },
    });

    // Retroactively synchronize existing matches for this new derby
    try {
      const matches = await prisma.match.findMany({
        include: { homePlayer: true, awayPlayer: true },
      });
      for (const m of matches) {
        const detected = detectDerby(m.homePlayer, m.awayPlayer, [newDerby]);
        if (detected && detected.id === newDerby.id) {
          await prisma.match.update({
            where: { id: m.id },
            data: {
              derbyId: newDerby.id,
              isDerby: true,
              derbyName: newDerby.name,
            },
          });
        }
      }
    } catch (syncErr) {
      console.warn("[POST /api/admin/derbies] Warning syncing existing fixtures:", syncErr);
    }

    return NextResponse.json({
      success: true,
      message: `Derby "${newDerby.name}" successfully created.`,
      derby: newDerby,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/derbies] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create derby configuration." },
      { status: 500 }
    );
  }
}
