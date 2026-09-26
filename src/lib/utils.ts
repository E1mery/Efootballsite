import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(dateStr);
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
