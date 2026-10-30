import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseDateSafe } from "./rwandanTime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) {
  const d = parseDateSafe(dateStr);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: "Africa/Kigali",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export * from "./rwandanTime";
