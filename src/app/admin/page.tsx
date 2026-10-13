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
  Megaphone,
  UserX,
  UserCheck,
  Flag,
  CheckCircle,
  EyeOff,
  MessageSquare,
  ChevronLeft,
  Clock,
  Layers,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { approveEvent, requestRevision, rejectEvent } from "@/app/actions/admin";
import { toggleUserBan, resolveReport } from "@/app/actions/reports";
import { PAKISTAN_CITIES_BY_POPULATION } from "@/lib/constants";
import { formatDatePKT } from "@/lib/dateUtils";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_banned: boolean;
  created_at: string | null;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  event_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  events?: {
    id: string;
    event_name: string;
    status: string | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

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
    description: "Actionable V1 operational metrics, city distribution, and category insights.",
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

  // ── User & Community Management State ───────────────────────────────────────
  const [communityTab, setCommunityTab] = useState<"users" | "reports">("users");
  const [profilesList, setProfilesList] = useState<UserProfile[]>([]);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [actingReportId, setActingReportId] = useState<string | null>(null);
  const [communitySuccess, setCommunitySuccess] = useState<string | null>(null);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  // State for the "View Note" description modal
  const [viewMessageReport, setViewMessageReport] = useState<ReportItem | null>(null);

  // ── Analytics State (V1 Actionable Metrics) ────────────────────────────────
  const [pulseStats, setPulseStats] = useState<{
    pendingEvents: number;
    pendingReports: number;
    recentEvents: number;
  } | null>(null);
  const [isLoadingPulse, setIsLoadingPulse] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [cityEventCounts, setCityEventCounts] = useState<Record<string, number>>({});
  const [cityPage, setCityPage] = useState(0); // 0-indexed (15 per page)
  const [showCategories, setShowCategories] = useState(false);
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[] | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // State for city-specific category breakdown
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [cityBreakdowns, setCityBreakdowns] = useState<Record<string, { category: string; count: number }[]>>({});
  const [loadingCityBreakdown, setLoadingCityBreakdown] = useState<string | null>(null);

  const fetchCommunityData = useCallback(async () => {
    setIsLoadingCommunity(true);
    setCommunityError(null);
    try {
      // 1. Fetch profiles
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_banned, created_at")
        .order("created_at", { ascending: false });

      if (pError) {
        console.error("Error fetching profiles:", pError);
        setCommunityError("Could not load users.");
      } else {
        setProfilesList((pData as UserProfile[]) || []);
      }

      // 2. Fetch pending reports
      const { data: rData, error: rError } = await supabase
        .from("reports")
        .select(`
          id,
          reporter_id,
          event_id,
          reason,
          description,
          status,
          created_at,
          events (
            id,
            event_name,
            status
          ),
          profiles:reporter_id (
            id,
            full_name,
            email
          )
        `)
        .eq("status", "Pending")
        .order("created_at", { ascending: false });

      if (rError) {
        console.error("Error fetching reports:", rError);
      } else {
        const normalized = ((rData || []) as any[]).map((r) => ({
          ...r,
          events: Array.isArray(r.events) ? r.events[0] : r.events,
          profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
        }));
        setReportsList(normalized);
      }
    } catch (err) {
      console.error("Unexpected error fetching community data:", err);
      setCommunityError("Unexpected error loading community data.");
    } finally {
      setIsLoadingCommunity(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && activeSection === "user-community") {
      fetchCommunityData();
    }
  }, [isLoadingAuth, activeSection, fetchCommunityData]);

  // Fetch V1 Analytics (Pulse metrics + City active counts)
  const fetchAnalyticsPulse = useCallback(async () => {
    setIsLoadingPulse(true);
    setAnalyticsError(null);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [eventsRes, reportsRes, pulseRes, cityRes] = await Promise.all([
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .in("status", ["Pending", "pending"]),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .in("status", ["Pending", "pending"]),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("events")
          .select("city")
          .in("status", ["Approved", "approved"]),
      ]);

      setPulseStats({
        pendingEvents: eventsRes.count ?? 0,
        pendingReports: reportsRes.count ?? 0,
        recentEvents: pulseRes.count ?? 0,
      });

      if (cityRes.data) {
        const counts: Record<string, number> = {};
        for (const item of cityRes.data) {
          if (item.city) {
            const c = item.city.trim().toLowerCase();
            counts[c] = (counts[c] || 0) + 1;
          }
        }
        setCityEventCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setAnalyticsError("Failed to load analytics pulse metrics.");
    } finally {
      setIsLoadingPulse(false);
    }
  }, []);

  // Fetch Category Breakdown On-Demand
  const handleToggleCategories = async () => {
    if (showCategories) {
      setShowCategories(false);
      return;
    }

    setShowCategories(true);
    if (categoryData === null) {
      setIsLoadingCategories(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("category");

        if (error) {
          console.error("Error fetching category breakdown:", error);
        } else if (data) {
          const counts: Record<string, number> = {};
          for (const item of data) {
            const cat = item.category ? item.category.trim() : "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
          }

          const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

          setCategoryData(sorted);
        }
      } catch (err) {
        console.error("Unexpected error loading categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && activeSection === "analytics") {
      fetchAnalyticsPulse();
    }
  }, [isLoadingAuth, activeSection, fetchAnalyticsPulse]);

  // Toggle and fetch city-specific category breakdown
  const handleToggleCityBreakdown = async (city: string) => {
    if (expandedCity === city) {
      setExpandedCity(null);
      return;
    }

    setExpandedCity(city);
    const cityKey = city.toLowerCase();

    // If already cached, don't refetch
    if (cityBreakdowns[cityKey]) {
      return;
    }

    setLoadingCityBreakdown(city);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("category")
        .ilike("city", city)
        .in("status", ["Approved", "approved"])
        .gte("event_date", todayStr);

      if (error) {
        console.error(`Error fetching category breakdown for ${city}:`, error);
      } else if (data) {
        const counts: Record<string, number> = {};
        for (const row of data) {
          const cat = row.category ? row.category.trim() : "Uncategorized";
          counts[cat] = (counts[cat] || 0) + 1;
        }

        const sorted = Object.entries(counts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        setCityBreakdowns((prev) => ({
          ...prev,
          [cityKey]: sorted,
        }));
      }
    } catch (err) {
      console.error(`Unexpected error fetching category breakdown for ${city}:`, err);
    } finally {
      setLoadingCityBreakdown(null);
    }
  };

  // Handle User Ban / Unban
  const handleToggleUserBan = async (user: UserProfile) => {
    setActingUserId(user.id);
    setCommunityError(null);
    setCommunitySuccess(null);
    try {
      const nextBanned = !user.is_banned;
      const res = await toggleUserBan(user.id, nextBanned);
      if (res.success) {
        setProfilesList((prev) =>
          prev.map((p) => (p.id === user.id ? { ...p, is_banned: nextBanned } : p))
        );
        setCommunitySuccess(
          nextBanned
            ? `User ${user.email || user.full_name || ""} has been banned.`
            : `User ${user.email || user.full_name || ""} has been unbanned.`
        );
      } else {
        setCommunityError(res.error || "Failed to update user ban status.");
      }
    } catch (err: any) {
      setCommunityError(err?.message || "Unexpected error updating user status.");
    } finally {
      setActingUserId(null);
    }
  };

  // Handle Resolve Report (Hide Event or Dismiss)
  const handleResolveReport = async (
    reportId: string,
    action: "hide_event" | "dismiss",
    eventTitle?: string
  ) => {
    setActingReportId(reportId);
    setCommunityError(null);
    setCommunitySuccess(null);
    try {
      const res = await resolveReport(reportId, action);
      if (res.success) {
        setReportsList((prev) => prev.filter((r) => r.id !== reportId));
        setCommunitySuccess(
          action === "hide_event"
            ? `Event "${eventTitle || "Reported Event"}" hidden and report resolved.`
            : "Report dismissed."
        );
      } else {
        setCommunityError(res.error || "Failed to resolve report.");
      }
    } catch (err: any) {
      setCommunityError(err?.message || "Unexpected error resolving report.");
    } finally {
      setActingReportId(null);
    }
  };

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
                        <React.Fragment key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs sm:text-sm transition-colors ${isSelected
                                ? "bg-slate-100 text-slate-900 font-bold border-l-3 border-[#186BA7]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`w-4 h-4 ${isSelected ? "text-[#186BA7]" : "text-slate-500"
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

                          {/* Sub-item under Content & Growth in Mobile */}
                          {item.id === "content-growth" && (
                            <div className="pl-11 pr-4 py-2 bg-slate-50 border-y border-slate-100">
                              <Link
                                href="/admin/announcements"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-between text-xs text-[#186BA7] font-semibold hover:underline"
                              >
                                <div className="flex items-center gap-2">
                                  <Megaphone className="w-3.5 h-3.5" />
                                  <span>Announcements</span>
                                </div>
                                <span className="text-[10px] bg-[#186BA7]/10 text-[#186BA7] px-1.5 py-0.5 rounded-xs">
                                  Manage &rarr;
                                </span>
                              </Link>
                            </div>
                          )}
                        </React.Fragment>
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
                      <React.Fragment key={item.id}>
                        <button
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border ${isSelected
                              ? "bg-slate-100 text-slate-900 border-slate-400 font-semibold"
                              : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-[#186BA7]" : "text-slate-500"
                                }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {isSelected && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          )}
                        </button>

                        {/* Sub-item under Content & Growth in Desktop Sidebar */}
                        {item.id === "content-growth" && (
                          <div className="pl-6 pr-2 py-0.5">
                            <Link
                              href="/admin/announcements"
                              className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-none transition-colors text-slate-600 hover:text-[#186BA7] hover:bg-slate-50 font-medium border border-transparent hover:border-slate-200"
                            >
                              <div className="flex items-center gap-2">
                                <Megaphone className="w-3.5 h-3.5 text-slate-400" />
                                <span>Announcements</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-slate-300" />
                            </Link>
                          </div>
                        )}
                      </React.Fragment>
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
                          className={`w-3.5 h-3.5 ${isLoadingEvents ? "animate-spin" : ""
                            }`}
                        />
                        Refresh
                      </button>
                    )}

                    {activeSection === "analytics" && (
                      <button
                        type="button"
                        onClick={() => {
                          fetchAnalyticsPulse();
                          setCityBreakdowns({});
                          if (showCategories) {
                            setCategoryData(null);
                          }
                        }}
                        disabled={isLoadingPulse}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isLoadingPulse ? "animate-spin" : ""}`}
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
                                className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors cursor-pointer ${isSelected
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
                                          <div className="font-medium">{formatDatePKT(ev.event_date)}</div>
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
                  ) : activeSection === "content-growth" ? (
                    /* ── Content and Growth Module ── */
                    <div className="space-y-6">
                      <div className="border border-slate-200 rounded-sm p-6 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 bg-white border border-slate-200 rounded-sm text-[#186BA7] shadow-2xs">
                            <Megaphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                              Homepage Announcements
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
                              Manage active promotional banners, competition announcements, and notices shown at the top of the homepage.
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/admin/announcements"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#186BA7] text-white rounded-sm hover:bg-[#155b8e] transition-colors whitespace-nowrap shadow-xs self-start sm:self-auto cursor-pointer"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          Manage Announcements &rarr;
                        </Link>
                      </div>

                      <div className="border border-dashed border-slate-200 rounded-sm p-8 text-center bg-white">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-2">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">Additional Content Modules</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Featured event boosts, homepage collections, and SEO overrides will be configured here.
                        </p>
                      </div>
                    </div>
                  ) : activeSection === "user-community" ? (
                    /* ── User and Community Management Module ── */
                    <div className="space-y-6">
                      {/* Top Action & Sub-tab Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCommunityTab("users")}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${communityTab === "users"
                                ? "bg-[#186BA7] text-white shadow-xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>User Management</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${communityTab === "users"
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-200 text-slate-700"
                                }`}
                            >
                              {profilesList.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCommunityTab("reports")}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${communityTab === "reports"
                                ? "bg-[#186BA7] text-white shadow-xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Reports Queue</span>
                            {reportsList.length > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white">
                                {reportsList.length}
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${communityTab === "reports"
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-200 text-slate-700"
                                  }`}
                              >
                                0
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Refresh Button */}
                        <button
                          type="button"
                          onClick={() => fetchCommunityData()}
                          disabled={isLoadingCommunity}
                          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-sm bg-white hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isLoadingCommunity ? "animate-spin" : ""}`}
                          />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {/* Success / Error Alerts */}
                      {communitySuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{communitySuccess}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCommunitySuccess(null)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                      {communityError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{communityError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCommunityError(null)}
                            className="text-red-700 hover:text-red-900 font-bold ml-2 cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                      {/* Loading State */}
                      {isLoadingCommunity ? (
                        <div className="py-16 text-center text-sm text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#186BA7]" />
                          Loading data...
                        </div>
                      ) : communityTab === "users" ? (
                        /* ── TAB 1: User Management Table ── */
                        <div className="space-y-4">
                          {/* Search / Filter input */}
                          <div className="flex items-center justify-between gap-4">
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              placeholder="Search users by name or email..."
                              className="w-full max-w-xs text-xs px-3 py-1.5 border border-slate-300 rounded-xs bg-white text-slate-800 focus:outline-hidden focus:border-[#186BA7]"
                            />
                            <span className="text-xs text-slate-400">
                              Showing{" "}
                              {
                                profilesList.filter(
                                  (u) =>
                                    !userSearchQuery.trim() ||
                                    (u.full_name || "")
                                      .toLowerCase()
                                      .includes(userSearchQuery.toLowerCase()) ||
                                    (u.email || "")
                                      .toLowerCase()
                                      .includes(userSearchQuery.toLowerCase())
                                ).length
                              }{" "}
                              of {profilesList.length} users
                            </span>
                          </div>

                          {/* Users Table */}
                          <div className="border border-slate-200 rounded-sm overflow-x-auto bg-white shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                  <th className="py-3 px-4">User</th>
                                  <th className="py-3 px-4">Email</th>
                                  <th className="py-3 px-4">Role</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {profilesList
                                  .filter(
                                    (u) =>
                                      !userSearchQuery.trim() ||
                                      (u.full_name || "")
                                        .toLowerCase()
                                        .includes(userSearchQuery.toLowerCase()) ||
                                      (u.email || "")
                                        .toLowerCase()
                                        .includes(userSearchQuery.toLowerCase())
                                  )
                                  .map((u) => {
                                    const isActing = actingUserId === u.id;
                                    return (
                                      <tr
                                        key={u.id}
                                        className={`hover:bg-slate-50/70 transition-colors ${u.is_banned ? "bg-red-50/20" : ""
                                          }`}
                                      >
                                        <td className="py-3 px-4 font-bold text-slate-900">
                                          <div>{u.full_name || "—"}</div>
                                          <div className="text-[10px] text-slate-400 font-normal">
                                            ID: {u.id.substring(0, 8)}...
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                          {u.email || "—"}
                                        </td>
                                        <td className="py-3 px-4">
                                          <span
                                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-xs border uppercase tracking-wider ${u.role === "admin"
                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                : u.role === "organizer"
                                                  ? "bg-blue-50 text-[#186BA7] border-blue-200"
                                                  : "bg-slate-100 text-slate-600 border-slate-200"
                                              }`}
                                          >
                                            {u.role || "user"}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          {u.is_banned ? (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                              Banned
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                              Active
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          {u.is_banned ? (
                                            <button
                                              type="button"
                                              disabled={isActing}
                                              onClick={() => handleToggleUserBan(u)}
                                              className="px-2.5 py-1 text-xs font-semibold border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 shadow-2xs"
                                            >
                                              <UserCheck className="w-3.5 h-3.5" />
                                              {isActing ? "Updating..." : "Unban"}
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              disabled={isActing || u.role === "admin"}
                                              onClick={() => handleToggleUserBan(u)}
                                              className="px-2.5 py-1 text-xs font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                              title={
                                                u.role === "admin"
                                                  ? "Cannot ban administrator"
                                                  : "Ban user"
                                              }
                                            >
                                              <UserX className="w-3.5 h-3.5" />
                                              {isActing ? "Updating..." : "Ban"}
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        /* ── TAB 2: Reports Queue ── */
                        <div className="space-y-4">
                          {reportsList.length === 0 ? (
                            <div className="border border-dashed border-slate-300 rounded-sm p-12 text-center bg-slate-50/50">
                              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                              <h4 className="text-sm font-bold text-slate-800">
                                No Pending Reports
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                All reported listings have been reviewed. The community queue is clear.
                              </p>
                            </div>
                          ) : (
                            <div className="border border-slate-200 rounded-sm overflow-x-auto bg-white shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4">Reported Event</th>
                                    <th className="py-3 px-4">Reason</th>
                                    <th className="py-3 px-4">Reported By</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {reportsList.map((rep) => {
                                    const eventTitle =
                                      rep.events?.event_name ||
                                      `Event #${rep.event_id.substring(0, 8)}`;
                                    const reporter =
                                      rep.profiles?.full_name ||
                                      rep.profiles?.email ||
                                      `User #${rep.reporter_id.substring(0, 8)}`;
                                    const isActing = actingReportId === rep.id;

                                    return (
                                      <tr
                                        key={rep.id}
                                        className="hover:bg-slate-50/70 transition-colors"
                                      >
                                        <td className="py-3 px-4 font-bold text-slate-900">
                                          <div>{eventTitle}</div>
                                          {rep.events?.status && (
                                            <div className="mt-1">
                                              <span
                                                className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-xs border ${rep.events.status === "Approved"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : rep.events.status === "Rejected"
                                                      ? "bg-red-50 text-red-700 border-red-200"
                                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                                  }`}
                                              >
                                                Status: {rep.events.status}
                                              </span>
                                            </div>
                                          )}
                                        </td>
                                        {/* Reason — badge only, no description text */}
                                        <td className="py-3 px-4">
                                          <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                            {rep.reason}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                          <div className="font-medium text-slate-800">
                                            {reporter}
                                          </div>
                                          {rep.profiles?.email && rep.profiles.full_name && (
                                            <div className="text-[11px] text-slate-400 font-mono">
                                              {rep.profiles.email}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                          {formatDatePKT(rep.created_at, { year: "numeric" })}
                                        </td>
                                        {/* Actions */}
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end gap-2">
                                            {/* View Note — only when description exists */}
                                            {rep.description && (
                                              <button
                                                type="button"
                                                onClick={() => setViewMessageReport(rep)}
                                                className="px-2.5 py-1 text-xs font-medium border border-slate-300 hover:bg-slate-100 text-slate-600 bg-white rounded-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                                title="View user's report message"
                                              >
                                                <MessageSquare className="w-3 h-3" />
                                                Note
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              disabled={isActing}
                                              onClick={() =>
                                                handleResolveReport(
                                                  rep.id,
                                                  "hide_event",
                                                  eventTitle
                                                )
                                              }
                                              className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 shadow-2xs"
                                              title="Hide event and resolve report"
                                            >
                                              <EyeOff className="w-3 h-3" />
                                              {isActing ? "Working..." : "Hide Event"}
                                            </button>
                                            <button
                                              type="button"
                                              disabled={isActing}
                                              onClick={() =>
                                                handleResolveReport(rep.id, "dismiss")
                                              }
                                              className="px-2.5 py-1 text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white rounded-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                                              title="Dismiss report without changing event"
                                            >
                                              {isActing ? "Working..." : "Dismiss"}
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
                      )}
                    </div>
                  ) : activeSection === "analytics" ? (
                    /* ── Analytics Module (Actionable V1) ── */
                    <div className="space-y-6">
                      {/* Analytics Error Alert */}
                      {analyticsError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{analyticsError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAnalyticsError(null)}
                            className="text-red-700 hover:text-red-900 font-bold ml-2 cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                      {/* 1. The "To-Do" & Pulse (Top Row) */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            The &ldquo;To-Do&rdquo; &amp; Platform Pulse
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Live operational metrics
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Pending Events Card */}
                          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs transition-shadow hover:shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-600">
                                Pending Events
                              </span>
                              <span className="p-1.5 rounded-xs bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                              {isLoadingPulse ? (
                                <span className="inline-block w-10 h-7 bg-slate-100 animate-pulse rounded-xs" />
                              ) : (
                                pulseStats?.pendingEvents ?? 0
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Events awaiting admin moderation
                            </p>
                          </div>

                          {/* Pending Reports Card */}
                          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs transition-shadow hover:shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-600">
                                Pending Reports
                              </span>
                              <span className="p-1.5 rounded-xs bg-red-50 text-red-700 border border-red-200">
                                <Flag className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                              {isLoadingPulse ? (
                                <span className="inline-block w-10 h-7 bg-slate-100 animate-pulse rounded-xs" />
                              ) : (
                                pulseStats?.pendingReports ?? 0
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Community flags awaiting resolution
                            </p>
                          </div>

                          {/* Pulse (Last 7 Days) Card */}
                          <div className="bg-white border border-slate-200 rounded-xs p-5 shadow-2xs transition-shadow hover:shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-600">
                                Pulse (Last 7 Days)
                              </span>
                              <span className="p-1.5 rounded-xs bg-sky-50 text-[#186BA7] border border-sky-200">
                                <TrendingUp className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                              {isLoadingPulse ? (
                                <span className="inline-block w-10 h-7 bg-slate-100 animate-pulse rounded-xs" />
                              ) : (
                                pulseStats?.recentEvents ?? 0
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              New event listings submitted
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 2. City Insights (The "Where" - Paginated) */}
                      <div className="border border-slate-200 rounded-xs bg-white shadow-2xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              City Insights
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Major Pakistani cities ranked by population with currently active (approved) event counts
                            </p>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            Page {cityPage + 1} of {Math.ceil(PAKISTAN_CITIES_BY_POPULATION.length / 15)}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                <th className="py-2.5 px-4 w-16">Rank</th>
                                <th className="py-2.5 px-4">City</th>
                                <th className="py-2.5 px-4 text-right">Active Events</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {PAKISTAN_CITIES_BY_POPULATION.slice(cityPage * 15, (cityPage + 1) * 15).map(
                                (city, idx) => {
                                  const rank = cityPage * 15 + idx + 1;
                                  const count = cityEventCounts[city.toLowerCase()] || 0;
                                  const isExpanded = expandedCity === city;
                                  const cityBreakdown = cityBreakdowns[city.toLowerCase()];
                                  const isLoadingThisCity = loadingCityBreakdown === city;

                                  return (
                                    <React.Fragment key={city}>
                                      <tr
                                        className={`transition-colors ${
                                          isExpanded
                                            ? "bg-slate-50/90"
                                            : "hover:bg-slate-50/60"
                                        }`}
                                      >
                                        <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">
                                          #{rank}
                                        </td>
                                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                                          {city}
                                          {rank <= 15 && (
                                            <span className="ml-2 text-[10px] text-slate-400 font-normal">
                                              Top 15
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                          <div className="flex items-center justify-end gap-2.5">
                                            {count > 0 ? (
                                              <>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  {count} {count === 1 ? "Active Event" : "Active Events"}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleCityBreakdown(city)}
                                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xs border transition-colors cursor-pointer shadow-2xs ${
                                                    isExpanded
                                                      ? "bg-[#186BA7] text-white border-[#186BA7]"
                                                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                                  }`}
                                                  title={`View category breakdown for ${city}`}
                                                >
                                                  <BarChart3 className="w-3 h-3" />
                                                  <span>{isExpanded ? "Hide Breakdown" : "View Breakdown"}</span>
                                                </button>
                                              </>
                                            ) : (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-normal text-slate-400">
                                                0
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>

                                      {/* Expanding Row: City-Specific Category Breakdown */}
                                      {isExpanded && (
                                        <tr className="bg-slate-50/80 border-t border-b border-slate-200">
                                          <td colSpan={3} className="py-3 px-4 sm:px-6">
                                            <div className="space-y-2">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                                  <BarChart3 className="w-3.5 h-3.5 text-[#186BA7]" />
                                                  Category Breakdown &mdash; {city}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                  Approved upcoming events (event_date &ge; today)
                                                </span>
                                              </div>

                                              {isLoadingThisCity ? (
                                                <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#186BA7]" />
                                                  <span>Loading breakdown for {city}...</span>
                                                </div>
                                              ) : cityBreakdown && cityBreakdown.length > 0 ? (
                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                  {cityBreakdown.map((item) => (
                                                    <span
                                                      key={item.category}
                                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                                                    >
                                                      <span className="font-medium text-slate-800">
                                                        {item.category}:
                                                      </span>
                                                      <span className="font-bold text-[#186BA7] bg-sky-50 px-1.5 py-0.2 rounded-xs text-[11px]">
                                                        {item.count}
                                                      </span>
                                                    </span>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-xs text-slate-500 italic py-1">
                                                  No upcoming active events found for {city} (events may have already concluded).
                                                </p>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                          <div>
                            Showing <span className="font-semibold text-slate-900">{cityPage * 15 + 1}</span> to{" "}
                            <span className="font-semibold text-slate-900">
                              {Math.min((cityPage + 1) * 15, PAKISTAN_CITIES_BY_POPULATION.length)}
                            </span>{" "}
                            of <span className="font-semibold text-slate-900">{PAKISTAN_CITIES_BY_POPULATION.length}</span> cities
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCityPage((p) => Math.max(0, p - 1))}
                              disabled={cityPage === 0}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-xs bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Previous</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCityPage((p) =>
                                  (p + 1) * 15 < PAKISTAN_CITIES_BY_POPULATION.length ? p + 1 : p
                                )
                              }
                              disabled={(cityPage + 1) * 15 >= PAKISTAN_CITIES_BY_POPULATION.length}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-xs bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Category Breakdown (On-Demand) */}
                      <div className="border border-slate-200 rounded-xs bg-white p-5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Category Breakdown
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              On-demand snapshot of total event counts per category
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggleCategories}
                            disabled={isLoadingCategories}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xs border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
                          >
                            <Layers className="w-3.5 h-3.5 text-slate-600" />
                            <span>
                              {showCategories
                                ? "Hide Category Breakdown"
                                : "View Category Breakdown"}
                            </span>
                          </button>
                        </div>

                        {showCategories && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            {isLoadingCategories ? (
                              <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Loading category distribution...</span>
                              </div>
                            ) : !categoryData || categoryData.length === 0 ? (
                              <p className="text-xs text-slate-500 py-3">
                                No event categories recorded yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {categoryData.map((cat) => (
                                  <div
                                    key={cat.name}
                                    className="flex items-center justify-between p-3 border border-slate-200 rounded-xs bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                  >
                                    <span className="text-xs font-semibold text-slate-800">
                                      {cat.name}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 px-2.5 py-0.5 bg-white border border-slate-200 rounded-xs shadow-2xs">
                                      {cat.count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
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
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-sm cursor-pointer transition-colors ${modalType === "revision"
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

      {/* ── View Note Modal ─────────────────────────────────────────────────── */}
      {viewMessageReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewMessageReport(null); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-note-title"
        >
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#292929] shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-300" />
                <h3 id="view-note-title" className="text-sm font-semibold text-white tracking-wide">
                  User&apos;s Report Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewMessageReport(null)}
                aria-label="Close"
                className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta */}
            <div className="px-5 pt-4 pb-2 border-b border-slate-100">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Reported Event</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {viewMessageReport.events?.event_name ||
                  `Event #${viewMessageReport.event_id.substring(0, 8)}`}
              </p>
              <p className="mt-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Category</p>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                {viewMessageReport.reason}
              </span>
            </div>

            {/* Body — the description */}
            <div className="px-5 py-4 flex-1">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">User&apos;s Message</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewMessageReport.description}
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMessageReport(null)}
                className="px-4 py-1.5 text-xs font-semibold border border-slate-300 rounded-xs bg-white text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
