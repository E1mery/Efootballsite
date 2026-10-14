import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureDerbyTable, resolveCanonicalClubId } from "@/lib/derbyService";
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureDerbyTable();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.derby.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Derby not found." }, { status: 404 });
    }

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

    const dataToUpdate: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Derby name cannot be empty." }, { status: 400 });
      }
      dataToUpdate.name = name.trim();
    }

    if (shortName !== undefined) {
      dataToUpdate.shortName = shortName.trim() || dataToUpdate.name || existing.name;
    }

    if (club1Id !== undefined && club2Id !== undefined) {
      const c1Canonical = resolveCanonicalClubId(club1Id);
      const c2Canonical = resolveCanonicalClubId(club2Id);

      if (!c1Canonical || !c2Canonical || c1Canonical === c2Canonical) {
        return NextResponse.json(
          { error: "Participating clubs must be two distinct registered teams." },
          { status: 400 }
        );
      }

      dataToUpdate.club1Id = c1Canonical;
      dataToUpdate.club2Id = c2Canonical;
      dataToUpdate.club1Name = findTeam(c1Canonical)?.name || club1Id;
      dataToUpdate.club2Name = findTeam(c2Canonical)?.name || club2Id;
    }

    if (competition !== undefined) dataToUpdate.competition = competition?.trim() || null;
    if (description !== undefined) dataToUpdate.description = description?.trim() || null;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl?.trim() || null;
    if (isHistoricRivalry !== undefined) dataToUpdate.isHistoricRivalry = Boolean(isHistoricRivalry);
    if (priority !== undefined) dataToUpdate.priority = Number(priority);
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (autoPublishSocial !== undefined) dataToUpdate.autoPublishSocial = Boolean(autoPublishSocial);
    if (autoPublishCarousel !== undefined) dataToUpdate.autoPublishCarousel = Boolean(autoPublishCarousel);

    const updated = await prisma.derby.update({
      where: { id },
      data: dataToUpdate,
    });

    // Update associated matches if name changed
    if (dataToUpdate.name && dataToUpdate.name !== existing.name) {
      await prisma.match.updateMany({
        where: { derbyId: id },
        data: { derbyName: dataToUpdate.name },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Derby "${updated.name}" updated successfully.`,
      derby: updated,
    });
  } catch (error: any) {
    console.error("[PUT /api/admin/derbies/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update derby configuration." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureDerbyTable();
    const { id } = await params;

    const existing = await prisma.derby.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Derby not found." }, { status: 404 });
    }

    // Safely decouple matches from this derby without deleting matches
    await prisma.match.updateMany({
      where: { derbyId: id },
      data: { derbyId: null, isDerby: false, derbyName: null },
    });

    await prisma.derby.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Derby "${existing.name}" removed successfully. Associated match history preserved.`,
    });
  } catch (error: any) {
    console.error("[DELETE /api/admin/derbies/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete derby configuration." },
      { status: 500 }
    );
  }
}
