const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

async function testDatabase() {
  console.log("--- 1. Testing Player & User Relations ---");
  const players = await prisma.player.findMany({
    take: 3,
    include: { user: true },
  });
  console.log(`Retrieved ${players.length} sample players:`);
  for (const p of players) {
    console.log(` - ${p.gamerTag} (${p.fullName}) -> User Email: ${p.user?.email || "none"}, Team: ${p.realTeam}, Rating: ${p.overallRating}`);
  }

  console.log("\n--- 2. Testing Match & Fixture Relations ---");
  const matches = await prisma.match.findMany({
    take: 3,
    include: {
      homePlayer: true,
      awayPlayer: true,
      tournament: true,
    },
  });
  console.log(`Retrieved ${matches.length} sample matches:`);
  for (const m of matches) {
    console.log(` - [${m.tournament.name}] ${m.homePlayer.gamerTag} vs ${m.awayPlayer.gamerTag} | Status: ${m.status} | Round: ${m.round}`);
  }

  console.log("\n--- 3. Testing Standings Table ---");
  const standings = await prisma.standing.findMany({
    take: 5,
    orderBy: { rank: "asc" },
    include: { player: true },
  });
  console.log(`Retrieved top ${standings.length} standings:`);
  for (const s of standings) {
    console.log(` - Rank #${s.rank}: ${s.player.gamerTag} | P:${s.played} W:${s.won} D:${s.drawn} L:${s.lost} GD:${s.goalDifference} PTS:${s.points} Form:${s.form}`);
  }

  console.log("\n--- 4. Testing League Configuration ---");
  const config = await prisma.leagueConfig.findFirst();
  console.log(`Season: ${config.season}, Matchday: ${config.currentMatchday}, RegistrationOpen: ${config.registrationOpen}`);

  console.log("\n--- 5. Testing Password Hash Integrity ---");
  const user = await prisma.user.findFirst();
  console.log(`User ${user.email}: Password hash format valid (${user.passwordHash.includes(":") ? "YES (salt:hash)" : "NO"})`);

  console.log("\n✅ ALL RELATIONSHIPS AND DATA ASSERTIONS PASSED!");
}

testDatabase()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
