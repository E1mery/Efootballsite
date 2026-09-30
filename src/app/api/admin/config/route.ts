import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";

// Verify admin session helper
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

export async function GET() {
  try {
    const config = await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        registrationOpen: true,
        currentMatchday: 1,
        uclStarted: false,
        europaStarted: false,
        div1MaxPlayers: 20,
        div2MaxPlayers: 20,
        div3MaxPlayers: 20,
      },
    });

    return NextResponse.json({ config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      registrationOpen,
      uclStarted,
      europaStarted,
      currentMatchday,
      div1MaxPlayers,
      div2MaxPlayers,
      div3MaxPlayers,
    } = body;

    const dataToUpdate: any = {};
    if (typeof registrationOpen === "boolean") dataToUpdate.registrationOpen = registrationOpen;
    if (typeof uclStarted === "boolean") dataToUpdate.uclStarted = uclStarted;
    if (typeof europaStarted === "boolean") dataToUpdate.europaStarted = europaStarted;
    if (typeof currentMatchday === "number") dataToUpdate.currentMatchday = currentMatchday;
    if (typeof div1MaxPlayers === "number" && div1MaxPlayers > 0) dataToUpdate.div1MaxPlayers = div1MaxPlayers;
    if (typeof div2MaxPlayers === "number" && div2MaxPlayers > 0) dataToUpdate.div2MaxPlayers = div2MaxPlayers;
    if (typeof div3MaxPlayers === "number" && div3MaxPlayers > 0) dataToUpdate.div3MaxPlayers = div3MaxPlayers;

    const updatedConfig = await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: dataToUpdate,
      create: {
        id: "default",
        ...dataToUpdate,
      },
    });

    // If registration is closed or opened, handle announcements and news
    if (typeof registrationOpen === "boolean") {
      if (registrationOpen) {
        await prisma.announcement.create({
          data: {
            title: "📢 Official Notice: League Registration is OPEN!",
            content: "Registration is officially open for eFootball Mobile Divisions 1, 2, and 3. Secure your gamer slot before division caps (20 players max) fill up.",
            type: "BROADCAST",
            isPinned: true,
          },
        });
      } else {
        await prisma.announcement.updateMany({
          where: {
            OR: [
              { title: { contains: "Registration is OPEN", mode: "insensitive" } },
              { content: { contains: "Registration is officially open", mode: "insensitive" } },
            ],
            isPinned: true,
          },
          data: { isPinned: false },
        }).catch(() => {});
        await prisma.news.updateMany({
          where: {
            OR: [
              { id: "sys-season-registration" },
              { title: { contains: "Registration", mode: "insensitive" } },
            ],
            showOnCarousel: true,
          },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }
    }

    if (typeof uclStarted === "boolean") {
      if (uclStarted) {
        await prisma.announcement.create({
          data: {
            title: "🏆 eFootball Champions League (UCL) Officially LAUNCHED!",
            content:
              "The League Administrator has inaugurated the UCL post-season championship! Qualified players (Top 8 from Div 1, Top 4 from Div 2, Top 4 from Div 3) must cast their group slot votes. Strict division separation rules apply.",
            type: "BROADCAST",
            isPinned: true,
          },
        });
      } else {
        // Locked: unpin any UCL announcements and turn off carousel display
        await prisma.announcement.updateMany({
          where: {
            OR: [
              { title: { contains: "Champions League", mode: "insensitive" } },
              { title: { contains: "UCL", mode: "insensitive" } },
              { content: { contains: "Champions League", mode: "insensitive" } },
              { content: { contains: "UCL", mode: "insensitive" } },
            ],
            isPinned: true,
          },
          data: { isPinned: false },
        }).catch(() => {});
        await prisma.news.updateMany({
          where: {
            OR: [
              { id: "sys-announcement-ucl-launched" },
              { title: { contains: "Champions League", mode: "insensitive" } },
              { title: { contains: "UCL", mode: "insensitive" } },
            ],
            showOnCarousel: true,
          },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }
    }

    if (typeof europaStarted === "boolean") {
      if (europaStarted) {
        await prisma.announcement.create({
          data: {
            title: "🌍 eFootball Europa League (UEL) Officially LAUNCHED!",
            content:
              "The League Administrator has inaugurated the Europa League tournament! Qualified players must complete their group draws and knockout brackets.",
            type: "BROADCAST",
            isPinned: true,
          },
        });
      } else {
        // Locked: unpin any Europa announcements and turn off carousel display
        await prisma.announcement.updateMany({
          where: {
            OR: [
              { title: { contains: "Europa League", mode: "insensitive" } },
              { title: { contains: "Europa", mode: "insensitive" } },
              { content: { contains: "Europa League", mode: "insensitive" } },
              { content: { contains: "Europa", mode: "insensitive" } },
            ],
            isPinned: true,
          },
          data: { isPinned: false },
        }).catch(() => {});
        await prisma.news.updateMany({
          where: {
            OR: [
              { id: "sys-announcement-europa-launched" },
              { title: { contains: "Europa League", mode: "insensitive" } },
              { title: { contains: "Europa", mode: "insensitive" } },
            ],
            showOnCarousel: true,
          },
          data: { showOnCarousel: false },
        }).catch(() => {});
      }
    }

    // Synchronize system news to ensure Admin News Tab displays all active items
    await syncSystemNewsToCarousel().catch(() => {});

    return NextResponse.json({
      success: true,
      message: "League configuration successfully updated.",
      config: updatedConfig,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
