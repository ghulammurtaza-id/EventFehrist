/**
 * Date and Timezone Utilities for Fehrist (PKT: Asia/Karachi, UTC+5)
 */

export const PKT_TIMEZONE = "Asia/Karachi";

/**
 * Returns today's date formatted as YYYY-MM-DD strictly in PKT.
 */
export function getTodayPKT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: PKT_TIMEZONE });
}

/**
 * Formats an ISO date string or YYYY-MM-DD date string strictly into PKT (Asia/Karachi).
 * Example: "2026-10-20" -> "Oct 20" or "Oct 20, 2026"
 */
export function formatDatePKT(
  dateString?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return "TBD";

  const trimmed = dateString.trim();
  let date: Date;

  // If it's a plain calendar date YYYY-MM-DD, anchor it to 12:00 UTC (17:00 PKT)
  // to avoid any day shifting regardless of server/client local timezone.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    date = new Date(Date.UTC(year, month - 1, day, 7, 0, 0)); // 07:00 UTC = 12:00 PKT
  } else {
    date = new Date(trimmed);
  }

  if (isNaN(date.getTime())) return "TBD";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PKT_TIMEZONE,
    month: "short",
    day: "numeric",
    ...options,
  };

  return date.toLocaleDateString("en-US", defaultOptions);
}

/**
 * Formats a date into a long descriptive format for modals or detail views in PKT.
 * Example: "October 20, 2026 (PKT)"
 */
export function formatDatePKTLong(dateString?: string | null): string {
  if (!dateString) return "Date TBD";
  const formatted = formatDatePKT(dateString, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${formatted} (PKT)`;
}

/**
 * Formats a timestamp into date & time strictly in PKT.
 * Example: "Oct 12, 2026, 9:15 PM PKT"
 */
export function formatDateTimePKT(dateString?: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  const formatted = date.toLocaleString("en-US", {
    timeZone: PKT_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formatted} PKT`;
}
