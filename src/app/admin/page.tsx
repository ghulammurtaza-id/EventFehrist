"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Check,
  Pencil,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { approveEvent, requestRevision, rejectEvent } from "@/app/actions/admin";

type AdminSection =
  | "moderation"
  | "content-growth"
  | "user-community"
  | "analytics";

interface MenuItem {
  id: AdminSection;
  label: string;
  heading: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "moderation",
    label: "Core Moderation",
    heading: "Core Moderation Dashboard",
    description: "Review pending submissions, request revisions, and moderate event listings.",
    icon: ShieldCheck,
  },
  {
    id: "content-growth",
    label: "Content and Growth",
    heading: "Content and Growth Dashboard",
    description: "Oversee featured events, SEO performance, categories, and platform reach.",
    icon: TrendingUp,
  },
  {
    id: "user-community",
    label: "User and Community Management",
    heading: "User and Community Management Dashboard",
    description: "Manage organizers, permissions, user roles, and community reports.",
    icon: Users,
  },
  {
    id: "analytics",
    label: "Analytics",
    heading: "Analytics Dashboard",
    description: "Track platform engagement, visitor trends, click-through rates, and event views.",
    icon: BarChart3,
  },
];

interface ModerationEvent {
  id: string;
  event_name: string;
  organizer_name: string;
  city: string;
  event_date: string;
  category: string;
  event_type: string;
  status: string | null;
  review_notes: string | null;
  registration_url: string | null;
  venue_location: string;
  fee: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("moderation");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Moderation state
  const [moderationEvents, setModerationEvents] = useState<ModerationEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actingEventId, setActingEventId] = useState<string | null>(null);

  // Filter state for moderation table
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Needs Revision">("All");

  // Modal state for notes (Needs Revision / Reject)
  const [modalType, setModalType] = useState<"revision" | "reject" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ModerationEvent | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Authenticate user & check admin role
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // Fetch user profile to verify role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || profile.role !== "admin") {
          console.warn("User role is not admin:", profile?.role);
        }
      } catch (err) {
        console.error("Error verifying admin access:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  // Fetch pending & needs revision events for moderation
  const fetchModerationEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setActionError(null);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, event_name, organizer_name, city, event_date, category, event_type, status, review_notes, registration_url, venue_location, fee, created_at"
        )
        .or("status.eq.Pending,status.eq.Needs Revision,status.eq.pending,status.eq.needs revision,status.eq.needs_revision")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching moderation events:", error);
        setActionError("Failed to load moderation events.");
        setModerationEvents([]);
      } else {
        setModerationEvents((data as ModerationEvent[]) || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching moderation events:", err);
      setActionError("Unexpected error loading events.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && activeSection === "moderation") {
      fetchModerationEvents();
    }
  }, [isLoadingAuth, activeSection, fetchModerationEvents]);

  // Handle Approve
  const handleApprove = async (eventId: string, eventName: string) => {
    setActingEventId(eventId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await approveEvent(eventId);
      if (res.success) {
        setActionSuccess(`"${eventName}" approved successfully.`);
        // Optimistically remove or update
        setModerationEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      } else {
        setActionError(res.error || "Failed to approve event.");
      }
    } catch (err) {
      console.error("Approve error:", err);
      setActionError("An error occurred while approving event.");
    } finally {
      setActingEventId(null);
    }
  };

  // Open Feedback Modal
  const openFeedbackModal = (type: "revision" | "reject", event: ModerationEvent) => {
    setModalType(type);
    setSelectedEvent(event);
    setFeedbackNotes(event.review_notes || "");
    setModalError(null);
  };

  const closeFeedbackModal = () => {
    setModalType(null);
    setSelectedEvent(null);
    setFeedbackNotes("");
    setModalError(null);
  };

  // Submit Feedback Modal (Revision or Reject)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (modalType === "revision" && !feedbackNotes.trim()) {
      setModalError("Please provide feedback explaining what needs revision.");
      return;
    }

    setIsSubmittingModal(true);
    setModalError(null);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (modalType === "revision") {
        const res = await requestRevision(selectedEvent.id, feedbackNotes.trim());
        if (res.success) {
          setActionSuccess(`Revision requested for "${selectedEvent.event_name}".`);
          // Update in local state
          setModerationEvents((prev) =>
            prev.map((ev) =>
              ev.id === selectedEvent.id
                ? { ...ev, status: "Needs Revision", review_notes: feedbackNotes.trim() }
                : ev
            )
          );
          closeFeedbackModal();
        } else {
          setModalError(res.error || "Failed to request revision.");
        }
      } else if (modalType === "reject") {
        const res = await rejectEvent(selectedEvent.id, feedbackNotes.trim());
        if (res.success) {
          setActionSuccess(`"${selectedEvent.event_name}" was rejected.`);
          // Remove from queue
          setModerationEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
          closeFeedbackModal();
        } else {
          setModalError(res.error || "Failed to reject event.");
        }
      }
    } catch (err) {
      console.error("Modal action error:", err);
      setModalError("An unexpected error occurred.");
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const activeItem =
    MENU_ITEMS.find((item) => item.id === activeSection) || MENU_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  // Filter events based on statusFilter
  const filteredEvents = moderationEvents.filter((ev) => {
    const raw = (ev.status || "Pending").trim();
    const isRev =
      raw === "Needs Revision" ||
      raw.toLowerCase() === "needs revision" ||
      raw.toLowerCase() === "needs_revision";
    const isPend = raw === "Pending" || raw.toLowerCase() === "pending";

    if (statusFilter === "Pending") return isPend;
    if (statusFilter === "Needs Revision") return isRev;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoadingAuth ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-500">
            Verifying admin credentials...
          </div>
        ) : (
          <>
            {/* ── Top Header ────────────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-t-sm rounded-b-none p-4 sm:p-6 bg-white mb-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-[#186BA7]/10 text-[#186BA7] px-2 py-0.5 rounded-xs">
                      Administration
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Centralized moderation and platform oversight for Fehrist.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-sm">
                    Active Module:{" "}
                    <span className="font-semibold text-slate-900">
                      {activeItem.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile Navigation Dropdown/Accordion ──────────────────── */}
            <div className="block md:hidden mb-4">
              <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-sm font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors"
                  aria-expanded={isMobileMenuOpen}
                >
                  <div className="flex items-center gap-2.5">
                    <ActiveIcon className="w-4 h-4 text-[#186BA7]" />
                    <span>{activeItem.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-normal text-slate-500">
                    <span>Menu</span>
                    {isMobileMenuOpen ? (
                      <X className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Menu className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                </button>

                {isMobileMenuOpen && (
                  <div className="border-t border-slate-200 divide-y divide-slate-100 bg-white">
                    {MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs sm:text-sm transition-colors ${
                            isSelected
                              ? "bg-slate-100 text-slate-900 font-bold border-l-3 border-[#186BA7]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isSelected ? "text-[#186BA7]" : "text-slate-500"
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#186BA7]">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Desktop & Tablet Layout: Sidebar + Main Content ───────── */}
            <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[580px]">
              {/* Left Sidebar (Desktop) */}
              <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 bg-white flex-shrink-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Navigation Menu
                  </p>
                </div>

                <nav className="p-3 space-y-1.5 flex-1">
                  {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border ${
                          isSelected
                            ? "bg-slate-100 text-slate-900 border-slate-400 font-semibold"
                            : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${
                              isSelected ? "text-[#186BA7]" : "text-slate-500"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Main Content Area */}
              <section className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 bg-white flex flex-col justify-between">
                <div>
                  {/* Section Heading */}
                  <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ActiveIcon className="w-6 h-6 text-[#186BA7]" />
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                          {activeItem.heading}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {activeItem.description}
                      </p>
                    </div>

                    {activeSection === "moderation" && (
                      <button
                        type="button"
                        onClick={fetchModerationEvents}
                        disabled={isLoadingEvents}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isLoadingEvents ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </button>
                    )}
                  </div>

                  {/* Feedback / Alert Banners */}
                  {actionSuccess && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-sm flex items-center justify-between">
                      <span>✓ {actionSuccess}</span>
                      <button
                        type="button"
                        onClick={() => setActionSuccess(null)}
                        className="text-emerald-700 hover:text-emerald-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {actionError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        {actionError}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActionError(null)}
                        className="text-red-700 hover:text-red-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ── CORE MODERATION CONTENT ── */}
                  {activeSection === "moderation" ? (
                    <div>
                      {/* Filter Tabs & Count */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-1.5">
                          {(["All", "Pending", "Needs Revision"] as const).map((tab) => {
                            const isSelected = statusFilter === tab;
                            return (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setStatusFilter(tab)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                {tab}
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-xs text-slate-500">
                          Showing{" "}
                          <span className="font-bold text-slate-800">
                            {filteredEvents.length}
                          </span>{" "}
                          events awaiting moderation
                        </div>
                      </div>

                      {/* Moderation Table */}
                      <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-xs">
                        {isLoadingEvents ? (
                          <div className="p-12 text-center text-sm text-slate-500">
                            Loading submissions for moderation...
                          </div>
                        ) : filteredEvents.length === 0 ? (
                          <div className="p-12 text-center">
                            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 font-bold">
                              ✓
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                              Queue is clean!
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              There are currently no events matching this filter requiring moderation.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                                  <th className="py-3 px-4">Event Details</th>
                                  <th className="py-3 px-4">Date & City</th>
                                  <th className="py-3 px-4">Category</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right pr-6">Moderation Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {filteredEvents.map((ev) => {
                                  const raw = (ev.status || "Pending").trim();
                                  const isRev =
                                    raw === "Needs Revision" ||
                                    raw.toLowerCase() === "needs revision" ||
                                    raw.toLowerCase() === "needs_revision";
                                  const isActing = actingEventId === ev.id;

                                  const badgeCls = isRev
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200";

                                  return (
                                    <React.Fragment key={ev.id}>
                                      <tr className="hover:bg-slate-50/60 transition-colors">
                                        {/* Event Name & Organizer */}
                                        <td className="py-3.5 px-4 font-bold text-slate-900 align-top max-w-xs">
                                          <div className="text-sm">{ev.event_name}</div>
                                          <div className="text-xs text-slate-500 font-normal mt-0.5">
                                            By: {ev.organizer_name}
                                          </div>
                                          {ev.registration_url && (
                                            <a
                                              href={ev.registration_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-[11px] text-[#186BA7] hover:underline mt-1 font-normal"
                                            >
                                              Registration Link
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          )}
                                        </td>

                                        {/* Date & City */}
                                        <td className="py-3.5 px-4 text-xs text-slate-700 align-top whitespace-nowrap">
                                          <div className="font-medium">{ev.event_date}</div>
                                          <div className="text-slate-500 mt-0.5">{ev.city}</div>
                                        </td>

                                        {/* Category & Event Type */}
                                        <td className="py-3.5 px-4 text-xs text-slate-700 align-top whitespace-nowrap">
                                          <div className="font-medium">{ev.category}</div>
                                          <div className="text-slate-500 mt-0.5">{ev.event_type}</div>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                          <span
                                            className={`inline-block text-xs px-2.5 py-1 font-semibold rounded-sm border ${badgeCls}`}
                                          >
                                            {isRev ? "Needs Revision" : "Pending"}
                                          </span>
                                        </td>

                                        {/* Action Buttons */}
                                        <td className="py-3.5 px-4 pr-6 align-top text-right whitespace-nowrap">
                                          <div className="inline-flex items-center gap-1.5">
                                            {/* Approve */}
                                            <button
                                              type="button"
                                              disabled={isActing}
                                              onClick={() => handleApprove(ev.id, ev.event_name)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                              title="Approve Event"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                              Approve
                                            </button>

                                            {/* Needs Revision */}
                                            <button
                                              type="button"
                                              disabled={isActing}
                                              onClick={() => openFeedbackModal("revision", ev)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                              title="Request Revisions"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                              Needs Revision
                                            </button>

                                            {/* Reject */}
                                            <button
                                              type="button"
                                              disabled={isActing}
                                              onClick={() => openFeedbackModal("reject", ev)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                              title="Reject Event"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                              Reject
                                            </button>
                                          </div>
                                        </td>
                                      </tr>

                                      {/* Existing feedback note if currently Needs Revision */}
                                      {isRev && ev.review_notes && (
                                        <tr key={`${ev.id}-note`} className="bg-orange-50/40 border-t-0">
                                          <td colSpan={5} className="px-4 py-2 text-xs">
                                            <div className="flex items-start gap-2 text-orange-900">
                                              <span className="font-bold whitespace-nowrap">Current Revision Note:</span>
                                              <span className="text-orange-800 break-words">{ev.review_notes}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── Other Modules (Shell) ── */
                    <div className="border border-dashed border-slate-300 rounded-sm p-8 sm:p-12 text-center bg-slate-50/50">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 text-[#186BA7] mb-4 shadow-2xs">
                        <ActiveIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                        {activeItem.heading}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                        Navigation shell initialized. Tables, filters, and actions for{" "}
                        <span className="font-medium text-slate-700">
                          {activeItem.label}
                        </span>{" "}
                        will be integrated here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Note inside card */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Fehrist Admin Suite</span>
                  <span>Section: {activeItem.label}</span>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* ── Feedback Modal (Needs Revision / Reject) ── */}
      {modalType && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {modalType === "revision" ? (
                  <>
                    <Pencil className="w-4 h-4 text-orange-600" />
                    Request Revisions
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-600" />
                    Reject Event
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={closeFeedbackModal}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Event: <span className="font-semibold text-slate-800">{selectedEvent.event_name}</span>
            </p>

            <form onSubmit={handleModalSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  {modalType === "revision"
                    ? "What needs to be fixed? *"
                    : "Reason for rejection (Optional):"}
                </label>
                <textarea
                  rows={4}
                  required={modalType === "revision"}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder={
                    modalType === "revision"
                      ? "e.g., Please provide a valid registration link and specify the event start time..."
                      : "Provide optional feedback for the organizer..."
                  }
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-none focus:outline-none focus:border-[#186BA7] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {modalError && (
                <div className="mb-4 p-2.5 bg-red-50 text-red-700 border border-red-200 text-xs rounded-sm">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeFeedbackModal}
                  disabled={isSubmittingModal}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-sm cursor-pointer transition-colors ${
                    modalType === "revision"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-red-600 hover:bg-red-700"
                  } ${isSubmittingModal ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSubmittingModal
                    ? "Submitting..."
                    : modalType === "revision"
                    ? "Submit Revision Request"
                    : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
