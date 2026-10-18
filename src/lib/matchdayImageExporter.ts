/**
 * Matchday Graphics & Image Exporter Engine
 * Generates broadcast-grade, high-resolution PNG graphics for eFootball Rwanda.
 * Strictly maps each competition to its official stadium background asset.
 */

export interface ExportStandingItem {
  rank: number;
  gamerTag: string;
  realTeam?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ExportFixtureItem {
  id: string;
  round: string;
  division: string;
  homeGamerTag: string;
  homeTeam?: string | null;
  awayGamerTag: string;
  awayTeam?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  matchDate?: string | Date;
  deadlineDate?: string | Date;
}

/**
 * Maps competition name to verified stadium background in /public/images/
 */
export function getCompetitionBackground(competition: string): string {
  const comp = competition.toUpperCase();
  if (comp.includes("UCL") || comp.includes("CHAMPIONS")) {
    return "/images/ucl-stadium-bg.jpg";
  }
  if (comp.includes("EUROPA")) {
    return "/images/europa-stadium-bg.jpg";
  }
  if (comp.includes("DIVISION 2") || comp.includes("DIV 2")) {
    return "/images/carousel-stadium-bg.jpg";
  }
  if (comp.includes("DIVISION 3") || comp.includes("DIV 3")) {
    return "/images/timeline-stadium-bg.jpg";
  }
  // Division 1 Premiership default
  return "/images/home-stadium-bg.jpg";
}

/**
 * Loads an image with standard browser Image object
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Triggers instant browser download of a Canvas as PNG
 */
function triggerDownload(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to draw cover-fitted image on canvas
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > canvasRatio) {
    sWidth = img.height * canvasRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / canvasRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, w, h);
}

/**
 * Export Standings Table as a Branded PNG
 */
export async function exportStandingsTablePng({
  division,
  standings,
  roundName,
  season = "Season 1 (2026)",
}: {
  division: string;
  standings: ExportStandingItem[];
  roundName: string;
  season?: string;
}): Promise<void> {
  const bgPath = getCompetitionBackground(division);
  const bgImg = await loadImage(bgPath);

  const width = 1200;
  const headerHeight = 260;
  const rowHeight = 52;
  const tableHeaderHeight = 48;
  const footerHeight = 90;
  const totalRows = Math.max(standings.length, 1);
  const height = headerHeight + tableHeaderHeight + totalRows * rowHeight + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw Background Stadium Image
  if (bgImg) {
    drawCoverImage(ctx, bgImg, width, height);
  } else {
    ctx.fillStyle = "#0c1021";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. High-contrast Dark Gradient Overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
  darkGrad.addColorStop(0, "rgba(8, 11, 22, 0.88)");
  darkGrad.addColorStop(0.3, "rgba(10, 14, 28, 0.93)");
  darkGrad.addColorStop(1, "rgba(6, 9, 18, 0.97)");
  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Top Accent Glow Bar
  const isDiv2 = division.toUpperCase().includes("DIVISION 2");
  const isUcl = division.toUpperCase().includes("UCL");
  const isEuropa = division.toUpperCase().includes("EUROPA");
  
  const accentGrad = ctx.createLinearGradient(0, 0, width, 0);
  if (isUcl) {
    accentGrad.addColorStop(0, "#2563EB");
    accentGrad.addColorStop(0.5, "#60A5FA");
    accentGrad.addColorStop(1, "#38BDF8");
  } else if (isEuropa || isDiv2) {
    accentGrad.addColorStop(0, "#D97706");
    accentGrad.addColorStop(0.5, "#F59E0B");
    accentGrad.addColorStop(1, "#FBBF24");
  } else {
    accentGrad.addColorStop(0, "#4F46E5");
    accentGrad.addColorStop(0.5, "#6366F1");
    accentGrad.addColorStop(1, "#EAB308");
  }
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, width, 8);

  // 4. Header Content
  ctx.textAlign = "center";
  
  // Tag / Meta
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = isEuropa || isDiv2 ? "#F59E0B" : "#818CF8";
  ctx.letterSpacing = "3px";
  ctx.fillText("RWANDA eFOOTBALL FEDERATION • OFFICIAL BROADCAST", width / 2, 58);
  ctx.letterSpacing = "0px";

  // Main Title
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(division.toUpperCase(), width / 2, 112);

  // Subtitle / Round Info
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText(`STANDINGS AFTER ${roundName.toUpperCase()} • ${season.toUpperCase()}`, width / 2, 146);

  // Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 180);
  ctx.lineTo(width - 80, 180);
  ctx.stroke();

  // 5. Table Header Box
  const tableX = 70;
  const tableW = width - 140;
  const startY = 210;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.roundRect
    ? ctx.roundRect(tableX, startY, tableW, tableHeaderHeight, [8, 8, 0, 0])
    : ctx.fillRect(tableX, startY, tableW, tableHeaderHeight);
  ctx.fill();

  // Table Column Headers
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.textAlign = "left";

  const colPos = tableX + 24;
  const colPlayer = tableX + 85;
  const colTeam = tableX + 380;
  const colP = tableX + 620;
  const colW = tableX + 690;
  const colD = tableX + 760;
  const colL = tableX + 830;
  const colGD = tableX + 900;
  const colPTS = tableX + 980;

  const headerY = startY + 29;
  ctx.fillText("POS", colPos, headerY);
  ctx.fillText("PLAYER", colPlayer, headerY);
  ctx.fillText("CLUB", colTeam, headerY);
  
  ctx.textAlign = "center";
  ctx.fillText("P", colP, headerY);
  ctx.fillText("W", colW, headerY);
  ctx.fillText("D", colD, headerY);
  ctx.fillText("L", colL, headerY);
  ctx.fillText("GD", colGD, headerY);
  
  ctx.fillStyle = "#F59E0B";
  ctx.font = "900 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("PTS", colPTS, headerY);

  // 6. Table Rows
  let curY = startY + tableHeaderHeight;
  standings.forEach((row, idx) => {
    // Alternating Row Background
    const isEven = idx % 2 === 0;
    ctx.fillStyle = isEven ? "rgba(15, 23, 42, 0.65)" : "rgba(30, 41, 59, 0.55)";
    ctx.fillRect(tableX, curY, tableW, rowHeight);

    // Row bottom border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.beginPath();
    ctx.moveTo(tableX, curY + rowHeight);
    ctx.lineTo(tableX + tableW, curY + rowHeight);
    ctx.stroke();

    const textY = curY + 32;

    // Rank Badge Accent
    ctx.textAlign = "left";
    ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
    if (row.rank <= 4) {
      // Top 4 Continental / Promotion Zone
      ctx.fillStyle = "#38BDF8";
      ctx.fillText(`${row.rank}`, colPos, textY);
    } else if (standings.length >= 10 && row.rank > standings.length - 3) {
      // Relegation Zone
      ctx.fillStyle = "#F87171";
      ctx.fillText(`${row.rank}`, colPos, textY);
    } else {
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(`${row.rank}`, colPos, textY);
    }

    // GamerTag
    ctx.font = "900 16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const truncatedTag = row.gamerTag.length > 22 ? row.gamerTag.substring(0, 20) + ".." : row.gamerTag;
    ctx.fillText(truncatedTag, colPlayer, textY);

    // Real Club
    ctx.font = "500 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#94A3B8";
    const teamText = row.realTeam || "Unassigned";
    const truncatedTeam = teamText.length > 22 ? teamText.substring(0, 20) + ".." : teamText;
    ctx.fillText(truncatedTeam, colTeam, textY);

    // Stats Numbers
    ctx.textAlign = "center";
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(`${row.played}`, colP, textY);
    ctx.fillText(`${row.won}`, colW, textY);
    ctx.fillText(`${row.drawn}`, colD, textY);
    ctx.fillText(`${row.lost}`, colL, textY);

    // Goal Difference
    const gdStr = row.goalDifference > 0 ? `+${row.goalDifference}` : `${row.goalDifference}`;
    ctx.fillStyle = row.goalDifference > 0 ? "#34D399" : row.goalDifference < 0 ? "#F87171" : "#94A3B8";
    ctx.fillText(gdStr, colGD, textY);

    // Points
    ctx.font = "900 18px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#F59E0B";
    ctx.fillText(`${row.points}`, colPTS, textY);

    curY += rowHeight;
  });

  // 7. Footer
  const footerY = curY + 45;
  ctx.textAlign = "center";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("efootball.rw • Official Tournament Platform • Kigali, Rwanda", width / 2, footerY);

  const cleanDivision = division.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const cleanRound = roundName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  triggerDownload(canvas, `efootball-rwanda-${cleanDivision}-standings-${cleanRound}.png`);
}

/**
 * Export Matchday Fixtures as a Branded PNG
 */
export async function exportFixturesPng({
  division,
  matches,
  roundName,
  season = "Season 1 (2026)",
}: {
  division: string;
  matches: ExportFixtureItem[];
  roundName: string;
  season?: string;
}): Promise<void> {
  const bgPath = getCompetitionBackground(division);
  const bgImg = await loadImage(bgPath);

  const width = 1200;
  const headerHeight = 250;
  const fixtureHeight = 84;
  const fixtureSpacing = 12;
  const footerHeight = 90;
  const totalMatches = Math.max(matches.length, 1);
  const height = headerHeight + totalMatches * (fixtureHeight + fixtureSpacing) + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw Background Stadium Image
  if (bgImg) {
    drawCoverImage(ctx, bgImg, width, height);
  } else {
    ctx.fillStyle = "#0c1021";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. High-contrast Dark Gradient Overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
  darkGrad.addColorStop(0, "rgba(8, 11, 22, 0.90)");
  darkGrad.addColorStop(0.3, "rgba(10, 14, 28, 0.94)");
  darkGrad.addColorStop(1, "rgba(6, 9, 18, 0.97)");
  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Top Accent Glow Bar
  const isDiv2 = division.toUpperCase().includes("DIVISION 2");
  const isUcl = division.toUpperCase().includes("UCL");
  const isEuropa = division.toUpperCase().includes("EUROPA");

  const accentGrad = ctx.createLinearGradient(0, 0, width, 0);
  if (isUcl) {
    accentGrad.addColorStop(0, "#2563EB");
    accentGrad.addColorStop(0.5, "#60A5FA");
    accentGrad.addColorStop(1, "#38BDF8");
  } else if (isEuropa || isDiv2) {
    accentGrad.addColorStop(0, "#D97706");
    accentGrad.addColorStop(0.5, "#F59E0B");
    accentGrad.addColorStop(1, "#FBBF24");
  } else {
    accentGrad.addColorStop(0, "#4F46E5");
    accentGrad.addColorStop(0.5, "#6366F1");
    accentGrad.addColorStop(1, "#EAB308");
  }
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, width, 8);

  // 4. Header Content
  ctx.textAlign = "center";
  
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = isEuropa || isDiv2 ? "#F59E0B" : "#818CF8";
  ctx.letterSpacing = "3px";
  ctx.fillText("RWANDA eFOOTBALL FEDERATION • MATCHDAY CLASHES", width / 2, 58);
  ctx.letterSpacing = "0px";

  // Main Title
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`${division.toUpperCase()} • ${roundName.toUpperCase()}`, width / 2, 112);

  // Subtitle
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText(`OFFICIAL FIXTURES & SCHEDULE • ${season.toUpperCase()}`, width / 2, 146);

  // Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 175);
  ctx.lineTo(width - 80, 175);
  ctx.stroke();

  // 5. Fixtures Cards
  const cardX = 80;
  const cardW = width - 160;
  let curY = 205;

  if (matches.length === 0) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(cardX, curY, cardW, 100);
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.textAlign = "center";
    ctx.fillText("No scheduled fixtures for this matchday round.", width / 2, curY + 55);
    curY += 120;
  } else {
    matches.forEach((m) => {
      // Fixture Card Container
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.roundRect
        ? ctx.roundRect(cardX, curY, cardW, fixtureHeight, 12)
        : ctx.fillRect(cardX, curY, cardW, fixtureHeight);
      ctx.fill();

      // Card Border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const centerY = curY + fixtureHeight / 2;

      // Center VS / Score Badge
      const isFinished = m.status === "FINISHED";
      const hasScore = m.homeScore != null && m.awayScore != null;

      const centerBoxW = 140;
      const centerBoxX = width / 2 - centerBoxW / 2;
      const centerBoxY = curY + 14;
      const centerBoxH = fixtureHeight - 28;

      ctx.fillStyle = isFinished ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.06)";
      ctx.roundRect
        ? ctx.roundRect(centerBoxX, centerBoxY, centerBoxW, centerBoxH, 8)
        : ctx.fillRect(centerBoxX, centerBoxY, centerBoxW, centerBoxH);
      ctx.fill();

      ctx.textAlign = "center";
      if (isFinished && hasScore) {
        ctx.font = "900 24px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#F59E0B";
        ctx.fillText(`${m.homeScore} - ${m.awayScore}`, width / 2, centerY + 8);
      } else {
        ctx.font = "900 16px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#CBD5E1";
        ctx.fillText("VS", width / 2, centerY + 5);
      }

      // Home Player (Left of Center, aligned right)
      ctx.textAlign = "right";
      const homeX = width / 2 - 90;
      ctx.font = "900 18px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(m.homeGamerTag, homeX, centerY - 2);

      ctx.font = "500 13px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(m.homeTeam || "Home Club", homeX, centerY + 18);

      // Away Player (Right of Center, aligned left)
      ctx.textAlign = "left";
      const awayX = width / 2 + 90;
      ctx.font = "900 18px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(m.awayGamerTag, awayX, centerY - 2);

      ctx.font = "500 13px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(m.awayTeam || "Away Club", awayX, centerY + 18);

      // Status Pill on far right
      ctx.textAlign = "right";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      if (isFinished) {
        ctx.fillStyle = "#34D399";
        ctx.fillText("FINISHED", cardX + cardW - 24, centerY + 4);
      } else if (m.status === "LIVE") {
        ctx.fillStyle = "#F87171";
        ctx.fillText("LIVE NOW", cardX + cardW - 24, centerY + 4);
      } else {
        ctx.fillStyle = "#94A3B8";
        ctx.fillText("SCHEDULED", cardX + cardW - 24, centerY + 4);
      }

      curY += fixtureHeight + fixtureSpacing;
    });
  }

  // 6. Footer
  const footerY = curY + 45;
  ctx.textAlign = "center";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("efootball.rw • Official Tournament Platform • Kigali, Rwanda", width / 2, footerY);

  const cleanDivision = division.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const cleanRound = roundName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  triggerDownload(canvas, `efootball-rwanda-${cleanDivision}-fixtures-${cleanRound}.png`);
}

/**
 * Generates ready-to-paste WhatsApp Broadcast text
 */
export function generateWhatsAppBroadcastText({
  division,
  standings,
  fixtures,
  roundName,
  season = "Season 1 (2026)",
}: {
  division: string;
  standings?: ExportStandingItem[];
  fixtures?: ExportFixtureItem[];
  roundName: string;
  season?: string;
}): string {
  const lines: string[] = [];
  lines.push(`🏆 *RWANDA eFOOTBALL LEAGUE*`);
  lines.push(`📍 *${division.toUpperCase()} — ${roundName.toUpperCase()}*`);
  lines.push(`📅 *${season}*`);
  lines.push(``);

  if (fixtures && fixtures.length > 0) {
    lines.push(`⚽ *${roundName.toUpperCase()} FIXTURES & RESULTS:*`);
    fixtures.forEach((f) => {
      const homeInfo = `${f.homeGamerTag}${f.homeTeam ? ` (${f.homeTeam})` : ""}`;
      const awayInfo = `${f.awayGamerTag}${f.awayTeam ? ` (${f.awayTeam})` : ""}`;
      if (f.status === "FINISHED" && f.homeScore != null && f.awayScore != null) {
        lines.push(`• ${homeInfo}  *${f.homeScore} - ${f.awayScore}*  ${awayInfo}  ✅`);
      } else {
        lines.push(`• ${homeInfo}  🆚  ${awayInfo}  [Scheduled]`);
      }
    });
    lines.push(``);
  }

  if (standings && standings.length > 0) {
    lines.push(`📊 *CURRENT STANDINGS (TOP 8):*`);
    standings.slice(0, 8).forEach((s) => {
      const gd = s.goalDifference > 0 ? `+${s.goalDifference}` : `${s.goalDifference}`;
      lines.push(`${s.rank}. *${s.gamerTag}* (${s.realTeam || "Club"}) — *${s.points} PTS* | P:${s.played} GD:${gd}`);
    });
    lines.push(``);
  }

  lines.push(`🌐 View full live tables and submit scores at:`);
  lines.push(`https://efootball.rw`);

  return lines.join("\n");
}
