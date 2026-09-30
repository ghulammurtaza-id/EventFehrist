"use client";

import { useEffect } from "react";
import { Event, getEventUIStatus } from "@/lib/mockData";

interface EventDetailsModalProps {
  event: Event;
  todayISO: string;
  onClose: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " (PKT)";
}

function getEventMode(event: Event): "Physical" | "Online" | "Hybrid" {
  if (event.mode) return event.mode;
  const loc = event.location_details.toLowerCase();
  if (event.event_type === "Webinar" || loc.includes("zoom") || loc.includes("online")) return "Online";
  if (loc.includes("hybrid")) return "Hybrid";
  return "Physical";
}

// Derive display fields with fallback defaults
function deriveExtras(event: Event) {
  const isFree = !event.fee || event.fee === "Free" || event.fee === "free";
  const fee = event.fee || (isFree ? "Free" : "Paid");

  const tags: string[] = event.tags && event.tags.length > 0 
    ? event.tags 
    : [event.category, event.event_type].filter(Boolean);

  const eligibility = event.eligibility || "University students";

  let teamSize = event.team_size;
  if (!teamSize) {
    if (event.event_type === "Hackathon") teamSize = "2-4 members";
    else if (event.event_type === "Competition") teamSize = "1-4 members";
    else teamSize = "Individual";
  }

  const prizes = event.prizes || (event.event_type === "Hackathon" || event.event_type === "Competition" ? "Rs. 500,000 total prize pool" : "—");
  const hasCert = event.certificate ?? (event.event_type !== "Meetup");

  const regDeadline = event.reg_deadline || (() => {
    const d = new Date(`${event.event_date}T00:00:00`);
    d.setDate(d.getDate() - 2);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return { fee, isFree, tags, eligibility, teamSize, prizes, hasCert, regDeadline };
}

// ── main modal ────────────────────────────────────────────────────────────────

export default function EventDetailsModal({ event, todayISO, onClose }: EventDetailsModalProps) {
  const uiStatus = getEventUIStatus(event, todayISO);
  const mode = getEventMode(event);
  const { fee, isFree, tags, eligibility, teamSize, prizes, hasCert, regDeadline } = deriveExtras(event);

  // Lock body scroll & handle Escape key
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const statusColor =
    uiStatus === "Registration Open" ? "text-[#3B853F]" :
    uiStatus === "Happening Today" ? "text-[#9A3412]" :
    uiStatus === "Completed" ? "text-slate-400" :
    uiStatus === "Cancelled" ? "text-red-500" :
    "text-slate-600";

  const buttonClasses =
    "px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer inline-flex items-center gap-1.5";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div
        className="bg-white w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-medium"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ backgroundColor: "#292929" }}
        >
          <h2 className="text-base font-medium text-white tracking-wide">Event Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-300 hover:text-white transition-colors p-1 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable content ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* Title block */}
          <div>
            <h1
              id="modal-event-title"
              className="text-2xl font-medium text-slate-900 leading-tight"
            >
              {event.title}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 flex items-center flex-wrap gap-1.5">
              <span>Organized by {event.organizer_name}</span>
              {event.is_verified && (
                <>
                  <span className="text-[#3B853F] font-medium flex items-center gap-0.5">
                    <span>✓</span> Verified
                  </span>
                </>
              )}
              <span className="text-slate-300">·</span>
              <span>{event.category}</span>
              <span className="text-slate-300">·</span>
              <span>{event.event_type}</span>
            </p>
          </div>

          {/* ── Details grid (Two-Tone Table) ─────────────────────────────────── */}
          <div className="mt-6 border border-slate-200 rounded-sm overflow-hidden divide-y divide-slate-200">
            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Date
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {formatDateLong(event.event_date)}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Time
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {event.start_time} – {event.end_time}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Venue
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {event.location_details}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Mode
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {mode}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Fee
              </div>
              <div className={`px-3.5 py-2.5 text-sm bg-white flex items-center font-medium ${isFree ? "text-[#3B853F]" : "text-slate-900"}`}>
                {fee}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Status
              </div>
              <div className={`px-3.5 py-2.5 text-sm bg-white flex items-center font-medium ${statusColor}`}>
                {uiStatus}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Eligibility
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {eligibility}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Team size
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {teamSize}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Prizes
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {prizes}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Certificate
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {hasCert ? "Yes" : "No"}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-stretch">
              <div className="px-3.5 py-2.5 text-sm text-slate-600 font-medium bg-slate-50 border-r border-slate-200 flex items-center">
                Reg. deadline
              </div>
              <div className="px-3.5 py-2.5 text-sm text-slate-900 bg-white flex items-center">
                {regDeadline}
              </div>
            </div>
          </div>

          {/* ── Description ───────────────────────────────────────────────────── */}
          <div className="mt-6">
            <h3 className="text-base font-medium text-slate-900 mb-2">Description</h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* ── Tags ─────────────────────────────────────────────────────────── */}
          {tags.length > 0 && (
            <div className="mt-5">
              <h3 className="text-base font-medium text-slate-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    className="px-3 py-1 text-xs border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-none inline-block select-none"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-white flex items-center gap-2 flex-wrap">
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses}
          >
            Register Now
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
              <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69L5.22 13.72a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
            </svg>
          </a>

          <button
            type="button"
            className={buttonClasses}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Save
          </button>

          <button
            type="button"
            className={buttonClasses}
          >
            Share
          </button>

          <button
            type="button"
            className={buttonClasses}
          >
            Report
          </button>
        </div>

      </div>
    </div>
  );
}
