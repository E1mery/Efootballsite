/**
 * Rwandan Time (Central Africa Time / CAT, UTC+2) Utilities
 * Rwanda does not observe Daylight Saving Time (DST) and is permanently UTC+2 (Africa/Kigali).
 */

export const RWANDA_TIMEZONE = "Africa/Kigali";
export const RWANDA_TIMEZONE_LABEL = "CAT";
export const RWANDA_TIMEZONE_FULL_LABEL = "CAT (Rwandan Time, UTC+2)";

/**
 * Returns "YYYY-MM-DD" formatted in Rwanda timezone (Africa/Kigali).
 */
export function getRwandanDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: RWANDA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Returns tomorrow's "YYYY-MM-DD" formatted in Rwanda timezone (Africa/Kigali).
 */
export function getTomorrowInRwandaString(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return getRwandanDateString(tomorrow);
}

/**
 * Creates a Date object anchored strictly to 00:00:00 (12:00 AM Midnight) in Rwanda (CAT / UTC+2)
 * for a given date string in "YYYY-MM-DD" format.
 *
 * Example: "2026-09-28" -> 2026-09-28T00:00:00+02:00 (which is 2026-09-27T22:00:00.000Z)
 */
export function createRwandanMidnight(dateStr?: string | Date): Date {
  if (!dateStr) {
    const tomorrowStr = getTomorrowInRwandaString();
    return new Date(`${tomorrowStr}T00:00:00+02:00`);
  }

  if (dateStr instanceof Date) {
    const ymd = getRwandanDateString(dateStr);
    return new Date(`${ymd}T00:00:00+02:00`);
  }

  const clean = String(dateStr).split("T")[0].trim();
  const parts = clean.split("-");
  if (parts.length === 3) {
    const y = parts[0].padStart(4, "0");
    const m = parts[1].padStart(2, "0");
    const d = parts[2].padStart(2, "0");
    return new Date(`${y}-${m}-${d}T00:00:00+02:00`);
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const ymd = getRwandanDateString(parsed);
    return new Date(`${ymd}T00:00:00+02:00`);
  }

  const tomorrowStr = getTomorrowInRwandaString();
  return new Date(`${tomorrowStr}T00:00:00+02:00`);
}

/**
 * Format a date in Rwandan Time (CAT)
 */
export function formatRwandanDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: RWANDA_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

/**
 * Format a time in Rwandan Time (CAT)
 */
export function formatRwandanTime(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    timeZone: RWANDA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/**
 * Format full date & time in Rwandan Time (CAT)
 */
export function formatRwandanDateTime(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    timeZone: RWANDA_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}
