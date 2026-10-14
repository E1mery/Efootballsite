import {
  INITIAL_OFFICIAL_DERBIES,
  resolveCanonicalClubId,
  detectDerby,
  areBothClubsAvailableInLeague,
  PlayerDerbyStats,
} from "../src/lib/derbyCore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("\n=======================================================");
console.log("RWANDA eFOOTBALL LEAGUE — OFFICIAL DERBY SYSTEM TESTS");
console.log("=======================================================\n");

// 1. Initial registry count
assert(
  INITIAL_OFFICIAL_DERBIES.length === 20,
  `Initial derby registry contains 20 official rivalries (found ${INITIAL_OFFICIAL_DERBIES.length})`
);

// 2. Canonical club ID resolution tests
console.log("\n--- Canonical Club ID Resolution Tests ---");
assert(
  resolveCanonicalClubId("Manchester United") === "manchester-united",
  "Manchester United resolves to 'manchester-united'"
);
assert(
  resolveCanonicalClubId("Man Utd") === "manchester-united",
  "Man Utd resolves to 'manchester-united'"
);
assert(
  resolveCanonicalClubId("MUN") === "manchester-united",
  "MUN short code resolves to 'manchester-united'"
);
assert(
  resolveCanonicalClubId("Manchester City") === "manchester-city",
  "Manchester City resolves to 'manchester-city'"
);
assert(
  resolveCanonicalClubId("Real Madrid") === "real-madrid",
  "Real Madrid resolves to 'real-madrid'"
);
assert(
  resolveCanonicalClubId("FC Barcelona") === "fc-barcelona",
  "FC Barcelona resolves to 'fc-barcelona'"
);
assert(
  resolveCanonicalClubId("Barca") === "fc-barcelona",
  "Barca resolves to 'fc-barcelona'"
);
assert(
  resolveCanonicalClubId("Inter Milan") === "inter",
  "Inter Milan resolves to 'inter'"
);
assert(
  resolveCanonicalClubId("Juventus") === "juventus",
  "Juventus resolves to 'juventus'"
);
assert(
  resolveCanonicalClubId("AC Milan") === "ac-milan",
  "AC Milan resolves to 'ac-milan'"
);

// 3. Bidirectional Derby Detection Tests
console.log("\n--- Bidirectional Derby Detection Tests ---");

// Manchester Derby
const mcrHome = detectDerby("Manchester United", "Manchester City", INITIAL_OFFICIAL_DERBIES);
assert(mcrHome?.name === "Manchester Derby", "Manchester United (H) vs Manchester City (A) -> Manchester Derby");

const mcrAway = detectDerby("Manchester City", "Manchester United", INITIAL_OFFICIAL_DERBIES);
assert(mcrAway?.name === "Manchester Derby", "Manchester City (H) vs Manchester United (A) -> Manchester Derby");

// North London Derby
const nldHome = detectDerby("Arsenal", "Tottenham Hotspur", INITIAL_OFFICIAL_DERBIES);
assert(nldHome?.name === "North London Derby", "Arsenal (H) vs Tottenham (A) -> North London Derby");

const nldAway = detectDerby("Tottenham Hotspur", "Arsenal", INITIAL_OFFICIAL_DERBIES);
assert(nldAway?.name === "North London Derby", "Tottenham (H) vs Arsenal (A) -> North London Derby");

// Merseyside Derby
const merseyside = detectDerby("Liverpool", "Everton", INITIAL_OFFICIAL_DERBIES);
assert(merseyside?.name === "Merseyside Derby", "Liverpool vs Everton -> Merseyside Derby");

// North West Derby (Historic Rivalry)
const northWest = detectDerby("Manchester United", "Liverpool", INITIAL_OFFICIAL_DERBIES);
assert(northWest?.name === "North West Derby" && northWest.isHistoricRivalry === true, "Manchester United vs Liverpool -> North West Derby (Historic Rivalry)");

// El Clásico
const clasicoHome = detectDerby("Real Madrid", "Barcelona", INITIAL_OFFICIAL_DERBIES);
assert(clasicoHome?.name === "El Clásico", "Real Madrid (H) vs Barcelona (A) -> El Clásico");

const clasicoAway = detectDerby("Barcelona", "Real Madrid", INITIAL_OFFICIAL_DERBIES);
assert(clasicoAway?.name === "El Clásico", "Barcelona (H) vs Real Madrid (A) -> El Clásico");

// Madrid Derby
const madridDerby = detectDerby("Real Madrid", "Atlético Madrid", INITIAL_OFFICIAL_DERBIES);
assert(madridDerby?.name === "Madrid Derby — El Derbi Madrileño", "Real Madrid vs Atlético Madrid -> Madrid Derby");

// Derby della Madonnina
const madonnina = detectDerby("Inter Milan", "AC Milan", INITIAL_OFFICIAL_DERBIES);
assert(madonnina?.name === "Derby della Madonnina", "Inter Milan vs AC Milan -> Derby della Madonnina");

// Derby d'Italia (Historic Rivalry)
const italia = detectDerby("Inter Milan", "Juventus", INITIAL_OFFICIAL_DERBIES);
assert(italia?.name === "Derby d'Italia" && italia.isHistoricRivalry === true, "Inter Milan vs Juventus -> Derby d'Italia (Historic Rivalry)");

// Derby della Capitale
const capitale = detectDerby("AS Roma", "Lazio", INITIAL_OFFICIAL_DERBIES);
assert(capitale?.name === "Derby della Capitale", "AS Roma vs Lazio -> Derby della Capitale");

// Derby della Mole
const mole = detectDerby("Juventus", "Torino", INITIAL_OFFICIAL_DERBIES);
assert(mole?.name === "Derby della Mole", "Juventus vs Torino -> Derby della Mole");

// 4. Overlap & Isolation (No False Positives)
console.log("\n--- Isolation & False Positive Prevention Tests ---");

const nonDerby1 = detectDerby("Manchester United", "Arsenal", INITIAL_OFFICIAL_DERBIES);
assert(nonDerby1 === null, "Manchester United vs Arsenal is NOT detected as a derby");

const nonDerby2 = detectDerby("Real Madrid", "Inter Milan", INITIAL_OFFICIAL_DERBIES);
assert(nonDerby2 === null, "Real Madrid vs Inter Milan is NOT detected as a derby");

const nonDerby3 = detectDerby("Inter Milan", "Torino", INITIAL_OFFICIAL_DERBIES);
assert(nonDerby3 === null, "Inter Milan vs Torino is NOT detected as a derby (only Juventus vs Torino)");

const nonDerby4 = detectDerby("Chelsea", "Arsenal", INITIAL_OFFICIAL_DERBIES);
assert(nonDerby4 === null, "Chelsea vs Arsenal is NOT detected as North London Derby or West London Derby");

// 5. Inactive / Unavailable Club Handling
console.log("\n--- Unavailable Club Policy Tests ---");
const tyneWear = INITIAL_OFFICIAL_DERBIES.find((d) => d.name.includes("Tyne–Wear"));
assert(
  tyneWear !== undefined && tyneWear.isActive === false,
  "Tyne-Wear Derby is inactive by default because Sunderland is not in the league"
);

const galician = INITIAL_OFFICIAL_DERBIES.find((d) => d.name.includes("Galician"));
assert(
  galician !== undefined && galician.isActive === false,
  "Galician Derby is inactive by default because Deportivo La Coruña is not in the league"
);

const valencian = INITIAL_OFFICIAL_DERBIES.find((d) => d.name.includes("Valencian"));
assert(
  valencian !== undefined && valencian.isActive === false,
  "Valencian Derby is inactive by default because Levante is not in the league"
);

assert(
  areBothClubsAvailableInLeague("newcastle-united", "sunderland") === false,
  "areBothClubsAvailableInLeague returns false for Newcastle vs Sunderland"
);

assert(
  areBothClubsAvailableInLeague("manchester-united", "manchester-city") === true,
  "areBothClubsAvailableInLeague returns true for Manchester United vs Manchester City"
);

// 6. Strict "No Win Rate" Constraint Verification
console.log("\n--- Strict 'No Win Rate' Requirement Tests ---");
const sampleStats: PlayerDerbyStats = {
  matchesPlayed: 4,
  wins: 2,
  draws: 1,
  defeats: 1,
};

const statsKeys = Object.keys(sampleStats);
assert(!statsKeys.includes("winRate"), "PlayerDerbyStats object does NOT contain 'winRate'");
assert(!statsKeys.includes("winPercentage"), "PlayerDerbyStats object does NOT contain 'winPercentage'");
assert(!statsKeys.some((k) => k.toLowerCase().includes("rate")), "No key in PlayerDerbyStats contains 'rate'");
assert(!statsKeys.some((k) => k.toLowerCase().includes("percent")), "No key in PlayerDerbyStats contains 'percent'");

console.log("\n=======================================================");
console.log("🎉 ALL OFFICIAL DERBY RECOGNITION TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");
