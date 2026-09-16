import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all legacy mockup records and demo accounts...");
  await prisma.matchSubmission.deleteMany();
  await prisma.forfeitClaim.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tournament.deleteMany();

  console.log("⚙️ Initializing League Configuration...");
  await prisma.leagueConfig.upsert({
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

  console.log("🏆 Creating Official eFootball Mobile Competitions...");
  await prisma.tournament.create({
    data: {
      name: "EFRL Mobile Division 1 (Premiership)",
      slug: "efrl-mobile-division-1-2026",
      season: "2026",
      format: "League",
      type: "DIVISION",
      prizePool: "3,000,000 RWF",
      status: "ONGOING",
    },
  });

  await prisma.tournament.create({
    data: {
      name: "EFRL Mobile Division 2 (Championship)",
      slug: "efrl-mobile-division-2-2026",
      season: "2026",
      format: "League",
      type: "DIVISION",
      prizePool: "1,500,000 RWF",
      status: "ONGOING",
    },
  });

  await prisma.tournament.create({
    data: {
      name: "EFRL Mobile Division 3 (National Academy)",
      slug: "efrl-mobile-division-3-2026",
      season: "2026",
      format: "League",
      type: "DIVISION",
      prizePool: "750,000 RWF",
      status: "ONGOING",
    },
  });

  await prisma.tournament.create({
    data: {
      name: "eFootball Mobile Champions League (UCL)",
      slug: "efootball-mobile-ucl-2026",
      season: "2026",
      format: "Group & Knockout",
      type: "UCL",
      prizePool: "2,000,000 RWF + Gold Trophy",
      status: "UPCOMING",
    },
  });

  await prisma.tournament.create({
    data: {
      name: "eFootball Mobile Europa League (UEL)",
      slug: "efootball-mobile-europa-2026",
      season: "2026",
      format: "Knockout Cup",
      type: "EUROPA",
      prizePool: "1,000,000 RWF",
      status: "UPCOMING",
    },
  });

  console.log("👑 Creating Official League Administrator Account...");
  const adminPasswordHash = hashPassword("admin123");
  await prisma.user.create({
    data: {
      email: "admin@efootball.rw",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log("📢 Posting League Welcome Announcement...");
  await prisma.announcement.create({
    data: {
      title: "🔥 Welcome to EFRL Season 2026 - eFootball Mobile Only!",
      content:
        "Welcome to the official eFootball Mobile Rwanda League. All matches must be completed within 24 hours (12:00 AM cutoff). Please coordinate with your opponent on WhatsApp and upload your match screenshot for administrator verification. Missing 3 consecutive matches results in immediate disqualification.",
      type: "BROADCAST",
      isPinned: true,
    },
  });

  console.log("✅ 100% clean database initialized! Zero mock/demo player accounts. Ready for real registrations.");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
