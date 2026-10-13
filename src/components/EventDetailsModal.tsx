"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, ExternalLink, Share2, Flag } from "lucide-react";
import { type Event, getEventUIStatus } from "@/lib/mockData";
import { supabase } from "@/lib/supabaseClient";
import ReportModal from "@/components/ReportModal";
import LoginModal from "@/components/LoginModal";

interface EventDetailsModalProps {
  event: Event;
  todayISO: string;
  onClose: () => void;
}

import { formatDatePKTLong, formatDatePKT } from "@/lib/dateUtils";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateLong(dateStr: string): string {
  return formatDatePKTLong(dateStr);
}

// Strips seconds from "HH:MM:SS" → "HH:MM"
function trimTime(t: string): string {
  return t ? t.substring(0, 5) : "";
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

  const regDeadline = event.reg_deadline ? formatDatePKT(event.reg_deadline) : (() => {
    const d = new Date(`${event.event_date}T00:00:00`);
    d.setDate(d.getDate() - 2);
    return formatDatePKT(d.toISOString().split("T")[0]);
  })();

  return { fee, isFree, tags, eligibility, teamSize, prizes, hasCert, regDeadline };
}

// ── main modal ────────────────────────────────────────────────────────────────

export default function EventDetailsModal({ event, todayISO, onClose }: EventDetailsModalProps) {
  const router = useRouter();
  const uiStatus = getEventUIStatus(event, todayISO);
  const mode = getEventMode(event);
  const { fee, isFree, tags, eligibility, teamSize, prizes, hasCert, regDeadline } = deriveExtras(event);

  // ── Save state ───────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Report modal state ───────────────────────────────────────────────────────
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Helper: show a brief toast message then clear it
  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleReportClick = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsLoginOpen(true);
    } else {
      setIsReportOpen(true);
    }
  };

  // Check on mount whether this event is already saved by the current user
  useEffect(() => {
    let cancelled = false;
    async function checkSaved() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id || cancelled) return;
      const { data } = await supabase
        .from("saved_events")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("event_id", event.id)
        .maybeSingle();
      if (!cancelled) setIsSaved(!!data);
    }
    checkSaved();
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const handleSave = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        // Not logged in — show toast instead of hard redirect
        showToast("Please login to save events");
        return;
      }

      setSaveLoading(true);

      if (isSaved) {
        // Unsave: delete by user_id + event_id (relies on RLS)
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("user_id", session.user.id)
          .eq("event_id", event.id);

        if (error) {
          console.error("[handleSave] Error details:", error.message, error.code, error.details);
        } else {
          setIsSaved(false);
          router.refresh(); // revalidate dashboard saved list
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("fehrist:saved_events_changed"));
          }
        }
      } else {
        // Save: insert new row
        const { error } = await supabase
          .from("saved_events")
          .insert({ user_id: session.user.id, event_id: event.id });

        if (error) {
          console.error("[handleSave] Error details:", error.message, error.code, error.details);
        } else {
          setIsSaved(true);
          router.refresh(); // revalidate dashboard saved list
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("fehrist:saved_events_changed"));
          }
        }
      }
    } catch (err) {
      console.error("[handleSave] Unexpected error:", err);
    } finally {
      setSaveLoading(false);
    }
  }, [isSaved, event.id, router]);

  const handleShare = useCallback(() => {
    const shareableUrl = `${window.location.origin}/?event=${event.id}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [event.id]);

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
      uiStatus === "Registration Closed" ? "text-[#DC2626]" :
        uiStatus === "Happening Today" ? "text-[#9A3412]" :
          uiStatus === "Completed" ? "text-slate-400" :
            uiStatus === "Cancelled" ? "text-red-500" :
              "text-slate-600";

  // Shared base classes matching the app design system
  const btnBase =
    "px-4 py-2 text-sm font-medium border rounded-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

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
                {trimTime(event.start_time)} – {trimTime(event.end_time)}
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
              <div className={`px-3.5 py-2.5 text-sm bg-white flex items-center font-medium ${isFree ? "text-[#3B853F]" : "text-[#DC2626]"}`}>
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
            {event.description && event.description.includes("<") ? (
              <div
                className="ql-editor description-preview !p-0 text-sm font-medium text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            ) : (
              <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description || "No description provided."}
              </p>
            )}
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

          {/* Register Now */}
          <a
            href={event.registration_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnBase} border-slate-300`}
          >
            Register Now
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Save / Saved */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveLoading}
            className={`${btnBase} ${isSaved
                ? "border-[#186BA7] text-[#186BA7]"
                : "border-slate-300"
              }`}
          >
            <Heart
              className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
            />
            {saveLoading
              ? isSaved ? "Unsaving..." : "Saving..."
              : isSaved ? "Saved" : "Save"
            }
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className={`${btnBase} border-slate-300`}
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>

          {/* Report */}
          <button
            type="button"
            onClick={handleReportClick}
            className="px-4 py-2 text-sm font-medium border border-red-300 rounded-sm bg-white text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Flag className="w-3.5 h-3.5 text-red-600" />
            Report
          </button>

          {/* Login-to-save / action toast */}
          {saveToast && (
            <span
              role="status"
              className="ml-auto text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-sm animate-pulse"
            >
              {saveToast}
            </span>
          )}
        </div>

      </div>

      {/* ── Report Modal ──────────────────────────────────────────────────────── */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        eventId={event.id}
        eventName={event.title}
      />

      {/* ── Login Modal ───────────────────────────────────────────────────────── */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        message="Please sign in to report this event."
        onSuccess={() => setIsReportOpen(true)}
      />
    </div>
  );
}
