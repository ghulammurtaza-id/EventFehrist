// EventsTable — pure display component.
// Receives already-filtered, already-paginated events from the page.
// Supports full light & dark mode themes with elevated cards.

import { type Event, getEventUIStatus } from "@/lib/mockData";

interface EventsTableProps {
  events: Event[];
  todayISO: string;
  startIndex: number; // for the # column numbering
  onEventClick?: (event: Event) => void;
}

// Derives "Physical" or "Online" from event data
function getEventMode(event: Event): "Physical" | "Online" | "Hybrid" {
  const loc = event.location_details.toLowerCase();
  if (event.event_type === "Webinar" || loc.includes("zoom") || loc.includes("online")) {
    return "Online";
  }
  if (loc.includes("hybrid")) return "Hybrid";
  return "Physical";
}

// Formats "2026-10-15" → "Oct 15"
function formatDate(dateStr: string): string {
  // Append T00:00:00 to avoid timezone off-by-one
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

// Strips seconds from "HH:MM:SS" → "HH:MM"
function trimTime(t: string): string {
  return t ? t.substring(0, 5) : "";
}

function StatusBadge({ status }: { status: string }) {
  let textColor = "text-slate-600 dark:text-slate-300";
  if (status === "Registration Open") {
    textColor = "text-[#3B853F]";
  } else if (status === "Registration Closed") {
    textColor = "text-[#DC2626] dark:text-red-400";
  } else if (status === "Happening Today" || status === "Upcoming") {
    textColor = "text-[#9A3412] dark:text-[#fb923c]";
  } else if (status === "Completed") {
    textColor = "text-slate-400 dark:text-slate-400";
  } else if (status === "Cancelled") {
    textColor = "text-red-500 dark:text-red-400";
  } else if (status === "Pending") {
    textColor = "text-yellow-700 dark:text-yellow-400";
  }

  return (
    <span
      className={`text-xs font-semibold leading-tight inline-block md:whitespace-nowrap ${textColor}`}
    >
      {status}
    </span>
  );
}

function ModeBadge({ mode }: { mode: "Physical" | "Online" | "Hybrid" }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0 text-[10px] font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-sm"
    >
      {mode}
    </span>
  );
}

// Verified checkmark (shown next to organizer name)
function VerifiedIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className="inline-block text-[#186BA7] dark:text-[#60a5fa]"
      aria-label="Verified organizer"
    >
      <path
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EventsTable({
  events,
  todayISO,
  startIndex,
  onEventClick,
}: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151d2e] py-16 text-center rounded-t-md transition-colors shadow-xs">
        <p className="text-slate-400 dark:text-slate-300 text-sm font-medium">No events found matching your filters.</p>
        <p className="text-slate-300 dark:text-slate-500 text-xs mt-1">Try adjusting your search or clearing the filters.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2e] overflow-x-auto rounded-t-md shadow-xs transition-colors">
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1a2438]">
            <th className="text-left px-2 py-2 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell md:w-8">
              #
            </th>
            <th className="text-left px-2 py-2 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-full min-w-0">
              Event
            </th>
            <th className="text-left px-2 py-2 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell md:w-28">
              City
            </th>
            <th className="text-left px-2 py-2 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-24 md:w-32">
              Date
            </th>
            <th className="text-left px-2 py-2 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell md:w-28">
              Type
            </th>
            <th className="text-left px-2 py-2 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell w-20 md:w-36">
              Status
            </th>
            <th className="text-right pl-2 pr-4 md:pl-3 md:pr-6 py-2 md:py-2.5 text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[90px] md:w-28">
              Fee
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => {
            const uiStatus = getEventUIStatus(event, todayISO);
            const mode = getEventMode(event);
            const rawFee =
              (event as { fee?: string | number; price?: string | number }).fee ??
              (event as { fee?: string | number; price?: string | number }).price ??
              "";
            const feeStr = String(rawFee).trim();
            const isFree = !feeStr || feeStr.toLowerCase() === "free" || feeStr === "0";
            const displayFee = isFree ? "Free" : feeStr;
            const feeColorClass = isFree
              ? "text-[#3B853F] font-semibold"
              : "text-[#DC2626] font-medium";

            return (
              <tr
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-[#EAEAEA] dark:hover:bg-slate-800/50 transition-colors duration-150 cursor-pointer"
              >
                {/* # */}
                <td className="px-2 py-2 md:px-3 md:py-3 align-middle text-slate-400 dark:text-slate-400 text-xs hidden md:table-cell md:w-8">
                  {startIndex + idx + 1}
                </td>

                {/* Event name + organizer */}
                <td className="px-2 py-2 md:px-3 md:py-3 align-middle w-full min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#186BA7] dark:group-hover:text-[#60a5fa] transition-colors leading-snug line-clamp-2 text-sm">
                    {event.title}
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-0.5 md:mt-1">
                    <span className="text-[11px] md:text-xs text-slate-400 dark:text-slate-400">
                      {event.organizer_name}
                    </span>
                    {event.is_verified && <VerifiedIcon />}
                    <span className="text-slate-200 dark:text-slate-700 text-xs">·</span>
                    <ModeBadge mode={mode} />
                  </div>
                </td>

                {/* City */}
                <td className="px-2 py-2 md:px-3 md:py-3 align-middle text-slate-600 dark:text-slate-300 text-xs hidden md:table-cell whitespace-nowrap md:w-28 font-medium">
                  {event.city}
                </td>

                {/* Date */}
                <td className="px-2 py-2 md:px-3 md:py-3 align-middle whitespace-nowrap w-24 md:w-32">
                  <div className="text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap">
                    {formatDate(event.event_date)}
                  </div>
                  <div className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-400 whitespace-nowrap">
                    {trimTime(event.start_time)} – {trimTime(event.end_time)}
                  </div>
                </td>

                {/* Type */}
                <td className="px-2 py-2 md:px-3 md:py-3 align-middle text-slate-600 dark:text-slate-300 text-xs hidden md:table-cell whitespace-nowrap md:w-28">
                  {event.event_type}
                </td>

                {/* Status */}
                <td className="px-2 py-2 md:px-3 md:py-3 align-middle hidden sm:table-cell w-20 md:w-36">
                  <StatusBadge status={uiStatus} />
                </td>

                {/* Fee */}
                <td className="pl-2 pr-4 md:pl-3 md:pr-6 py-2 md:py-3 align-middle text-right whitespace-nowrap min-w-[90px] md:w-28">
                  <span className={`text-xs ${feeColorClass} whitespace-nowrap`}>
                    {displayFee}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
