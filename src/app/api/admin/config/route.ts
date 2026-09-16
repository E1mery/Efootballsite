import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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
    const { registrationOpen, uclStarted, europaStarted, currentMatchday } = body;

    const dataToUpdate: any = {};
    if (typeof registrationOpen === "boolean") dataToUpdate.registrationOpen = registrationOpen;
    if (typeof uclStarted === "boolean") dataToUpdate.uclStarted = uclStarted;
    if (typeof europaStarted === "boolean") dataToUpdate.europaStarted = europaStarted;
    if (typeof currentMatchday === "number") dataToUpdate.currentMatchday = currentMatchday;

    const updatedConfig = await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: dataToUpdate,
      create: {
        id: "default",
        ...dataToUpdate,
      },
    });

    // If registration is closed or opened, create an automatic broadcast announcement
    if (typeof registrationOpen === "boolean") {
      await prisma.announcement.create({
        data: {
          title: registrationOpen
            ? "📢 Official Notice: League Registration is OPEN!"
            : "🛑 Official Notice: League Registration is now CLOSED!",
          content: registrationOpen
            ? "Registration is officially open for eFootball Mobile Divisions 1, 2, and 3. Secure your gamer slot before division caps (20 players max) fill up."
            : "Registration has closed! Matchday schedules are now being generated. All players must prepare to play their 24-hour cycle fixtures.",
          type: "BROADCAST",
          isPinned: true,
        },
      });
    }

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
    }

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
    }

    return NextResponse.json({
      success: true,
      message: "League configuration successfully updated.",
      config: updatedConfig,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
