"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { Event, EventCategory, EventStatus } from "@/lib/mockData";
import EventDetailsModal from "@/components/EventDetailsModal";

const TODAY_ISO = new Date().toISOString().split("T")[0];

type DbEvent = Database["public"]["Tables"]["events"]["Row"];

function mapDbRow(row: Partial<DbEvent> & { id: string; event_name: string }): Event {
  let mode: "Physical" | "Online" | "Hybrid" = "Physical";
  const venue = (row.venue_location || "").toLowerCase();
  const highlights = row.highlights || [];
  if (
    row.event_type === "Webinar" ||
    venue.includes("zoom") ||
    venue.includes("online") ||
    highlights.some((h) => h.toLowerCase().includes("online"))
  ) {
    mode = "Online";
  } else if (
    venue.includes("hybrid") ||
    highlights.some((h) => h.toLowerCase().includes("hybrid"))
  ) {
    mode = "Hybrid";
  }

  return {
    id: row.id,
    title: row.event_name,
    description: row.description || "",
    event_date: row.event_date || "",
    start_time: row.start_time || "",
    end_time: row.end_time || "",
    city: row.city || "Pakistan",
    category: (row.category as EventCategory) || "Technology",
    event_type: (row.event_type as Event["event_type"]) || "Conference",
    location_details: row.venue_location || "",
    registration_url: row.registration_url || "",
    organizer_name: row.organizer_name || "Organizer",
    is_verified: false,
    status: (row.status as EventStatus) || "Pending",
    submitted_by_user_id: row.organizer_id || "",
    fee: row.fee?.toLowerCase().trim() === "free" ? "Free" : (row.fee || "Free"),
    eligibility: undefined,
    team_size: undefined,
    prizes: undefined,
    certificate: highlights.some((h) => h.toLowerCase().includes("certificate")),
    reg_deadline: row.registration_deadline || undefined,
    tags: row.highlights || [],
    mode,
  };
}

interface SavedEventItem {
  id: string;
  event_id: string;
  events?: DbEvent | null;
}

const EVENTS_PER_PAGE = 10;

// Sub-component: Pagination
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  const btnBase =
    "w-8 h-8 flex items-center justify-center text-sm border rounded-sm transition-colors cursor-pointer select-none";
  const btnDefault =
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  const btnActive = "bg-[#186BA7] text-white border-[#186BA7] font-semibold";
  const btnDisabled = "opacity-40 cursor-not-allowed pointer-events-none";

  return (
    <div className="mt-5 flex items-center justify-center gap-2 select-none">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnDefault} ${currentPage === 1 ? btnDisabled : ""}`}
        aria-label="Previous page"
      >
        &#8249;
      </button>
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`${btnBase} ${currentPage === p ? btnActive : btnDefault}`}
            aria-current={currentPage === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${btnDefault} ${currentPage === totalPages ? btnDisabled : ""}`}
        aria-label="Next page"
      >
        &#8250;
      </button>
    </div>
  );
}

export default function SavedEventsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [savedEvents, setSavedEvents] = useState<SavedEventItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / EVENTS_PER_PAGE));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const fetchSavedEvents = useCallback(async (userId: string, page: number) => {
    setIsLoadingEvents(true);
    try {
      const from = (page - 1) * EVENTS_PER_PAGE;
      const to = page * EVENTS_PER_PAGE - 1;

      const { count } = await supabase
        .from("saved_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      setTotalCount(count ?? 0);

      const { data, error } = await supabase
        .from("saved_events")
        .select("id, event_id, events (*)")
        .eq("user_id", userId)
        .range(from, to);

      if (!error && data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          event_id: item.event_id,
          events: Array.isArray(item.events) ? item.events[0] : item.events,
        }));
        setSavedEvents(formatted);
      } else {
        setSavedEvents([]);
      }
    } catch (err) {
      console.error("Error fetching saved events:", err);
      setSavedEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const handleViewEvent = async (item: SavedEventItem) => {
    if (item.events) {
      setSelectedEvent(mapDbRow(item.events));
    } else if (item.event_id) {
      try {
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("id", item.event_id)
          .single();
        if (data) {
          setSelectedEvent(mapDbRow(data as DbEvent));
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
      }
    }
  };

  useEffect(() => {
    async function loadUser() {
      setIsLoadingUser(true);
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);
        fetchSavedEvents(currentUser.id, 1);
      } catch (err) {
        console.error("Error loading user:", err);
        router.push("/login");
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUser();
  }, [router, fetchSavedEvents]);

  useEffect(() => {
    if (user && !isLoadingUser) {
      fetchSavedEvents(user.id, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleUnsave = async (id: string) => {
    setUnsavingId(id);
    try {
      const { error } = await supabase.from("saved_events").delete().eq("id", id);
      if (!error) {
        if (savedEvents.length === 1 && currentPage > 1) {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          if (user) fetchSavedEvents(user.id, newPage);
        } else {
          setSavedEvents((prev) => prev.filter((item) => item.id !== id));
          setTotalCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Error unsaving event:", err);
    } finally {
      setUnsavingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">
            Loading...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl font-bold text-slate-900">
                  Saved Events{totalCount > 0 ? ` (${totalCount})` : ""}
                </h1>
                <p className="text-xs text-slate-500 mt-1">Manage your bookmarked events</p>
              </div>
              <Link
                href="/dashboard?tab=saved"
                className="text-sm font-medium text-[#186BA7] hover:underline flex items-center gap-1 sm:ml-auto mt-1 sm:mt-0 w-fit"
              >
                &larr; Back to Dashboard
              </Link>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-t-sm rounded-b-none overflow-hidden bg-white shadow-sm">
              {isLoadingEvents ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Loading saved events...
                </div>
              ) : savedEvents.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-slate-500 mb-3">
                    You have not saved any events yet.
                  </p>
                  <Link
                    href="/"
                    className="inline-block text-xs sm:text-sm font-semibold border border-slate-300 bg-gray-100 text-slate-900 px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors"
                  >
                    Explore Events
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[340px] md:min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                        <th className="py-3 px-4">Event Name</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                        <th className="py-3 px-4 hidden md:table-cell">City</th>
                        <th className="py-3 px-4 hidden md:table-cell">Organizer</th>
                        <th className="py-3 px-4 pr-6 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {savedEvents.map((item) => {
                        const eventTitle = item.events?.event_name || "Untitled Event";
                        const eventDate = formatDate(item.events?.event_date);
                        const city = item.events?.city || "Pakistan";
                        const organizer = item.events?.organizer_name || "Organizer";
                        const eventId = item.events?.id || item.event_id;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div>{eventTitle}</div>
                              <div className="sm:hidden text-xs text-slate-500 font-normal mt-1">
                                {eventDate}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap hidden sm:table-cell">
                              {eventDate}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell">
                              {city}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell">
                              {organizer}
                            </td>
                            <td className="py-3.5 px-4 pr-6 text-left whitespace-nowrap min-w-[160px]">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                  type="button"
                                  disabled={unsavingId === item.id}
                                  onClick={() => handleUnsave(item.id)}
                                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium border border-slate-300 rounded-sm bg-white hover:bg-slate-100 cursor-pointer transition-colors text-[#DC2626] ${
                                    unsavingId === item.id ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                >
                                  {unsavingId === item.id ? "Unsaving..." : "Unsave"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleViewEvent(item)}
                                  className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium border border-slate-300 rounded-sm bg-white hover:bg-slate-100 cursor-pointer transition-colors text-slate-900 inline-flex items-center justify-center"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

      {/* ── Event Details Modal ────────────────────────────────────────────── */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          todayISO={TODAY_ISO}
          onClose={() => {
            setSelectedEvent(null);
            if (user?.id) fetchSavedEvents(user.id, currentPage);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
