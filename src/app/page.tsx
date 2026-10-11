"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  EVENT_TYPES,
  type Event,
  type EventCategory,
  getEventUIStatus,
} from "@/lib/mockData";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Sidebar, { type SidebarFilters } from "@/components/Sidebar";
import EventsTable from "@/components/EventsTable";
import CityCombobox from "@/components/CityCombobox";
import EventDetailsModal from "@/components/EventDetailsModal";
import CustomDropdown from "@/components/CustomDropdown";

// Today's date in YYYY-MM-DD (PKT) — used for status badge derivation.
// Evaluated once at module level to avoid hydration mismatch.
const TODAY_ISO = new Date().toISOString().split("T")[0];

// DB row type alias
type DbEvent = Database["public"]["Tables"]["events"]["Row"];

// Map a Supabase DB row to the Event type used by EventsTable / EventDetailsModal
function mapDbRow(row: DbEvent): Event {
  // Derive mode from highlights or venue_location
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
    description: row.description,
    event_date: row.event_date,
    start_time: row.start_time || "",
    end_time: row.end_time || "",
    city: row.city,
    category: row.category as EventCategory,
    event_type: row.event_type as Event["event_type"],
    location_details: row.venue_location,
    registration_url: row.registration_url || "",
    organizer_name: row.organizer_name,
    is_verified: false, // not in DB schema
    status: "approved", // only approved events are fetched
    submitted_by_user_id: row.organizer_id || "",
    fee: row.fee || "Free",
    eligibility: undefined,
    team_size: undefined,
    prizes: undefined,
    certificate: highlights.some((h) => h.toLowerCase().includes("certificate")),
    reg_deadline: row.registration_deadline || undefined,
    tags: row.highlights || [],
    mode,
  };
}

// Category pills shown in the filter row
const CATEGORY_PILLS: (EventCategory | "All")[] = [
  "All",
  "Technology",
  "Business",
  "Arts & Culture",
  "Gaming",
  "Health & Wellness",
  "Sports",
  "Food & Lifestyle",
  "Education",
];

// Date filter pills
const DATE_PILLS = ["All", "Today", "This Week", "This Month", "Custom"] as const;
type DateFilter = (typeof DATE_PILLS)[number];

// Filter options for custom dropdowns
const TYPE_OPTIONS = ["All Types", ...EVENT_TYPES] as const;
const PRICE_OPTIONS = ["Any Price", "Free", "Paid"] as const;
const MODE_OPTIONS = ["Any Mode", "Physical", "Online", "Hybrid"] as const;

// Helper — returns ISO date YYYY-MM-DD n days from today
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// Sidebar defaults
const DEFAULT_SIDEBAR: SidebarFilters = { audience: [], level: [], highlights: [] };

// ── Inner component (needs Suspense because it calls useSearchParams) ────────
function HomePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Data state ────────────────────────────────────────────────────────────────
  // Only the current page's rows are held in memory (10 at a time)
  const [pageEvents, setPageEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // Toast shown when a deep-linked event ID is not found in the data
  const [eventNotFoundToast, setEventNotFoundToast] = useState(false);

  // ── Filter state (URL-synced: city, category, page) ──────────────────────────
  // city & category are pushed to the query string so they survive refresh/share.
  // Remaining filters stay in local state (they apply on the 10-row page slice).
  const urlCity = searchParams.get("city") ?? "Karachi";
  const urlCategory = (searchParams.get("category") ?? "All") as EventCategory | "All";
  const urlPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<DateFilter>("All");
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [selectedPrice, setSelectedPrice] = useState<string>("Any Price");
  const [selectedMode, setSelectedMode] = useState<string>("Any Mode");
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(DEFAULT_SIDEBAR);

  const EVENTS_PER_PAGE = 10;
  const listContainerRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);
  // Track whether we've already tried to open the deep-linked event
  const deepLinkHandled = useRef(false);

  // ── URL-param helpers ─────────────────────────────────────────────────────────
  // Push city/category/page changes into the URL.
  const pushParams = useCallback(
    (updates: { city?: string; category?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.city !== undefined) params.set("city", updates.city);
      if (updates.category !== undefined) params.set("category", updates.category);
      if (updates.page !== undefined) params.set("page", String(updates.page));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const selectedCity = urlCity;
  const selectedCategory = urlCategory;

  // ── Reset all filters whenever selectedCity changes ──────────────────────────
  const prevCityRef = useRef(selectedCity);
  useEffect(() => {
    if (prevCityRef.current !== selectedCity) {
      prevCityRef.current = selectedCity;
      setSearchQuery("");
      setSelectedDate("All");
      setSelectedType("All Types");
      setSelectedPrice("Any Price");
      setSelectedMode("Any Mode");
      setSidebarFilters(DEFAULT_SIDEBAR);
      pushParams({ city: selectedCity, category: "All", page: 1 });
    }
  }, [selectedCity, pushParams]);

  // Smooth scroll to top of list when page changes
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (listContainerRef.current) {
      listContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [urlPage]);

  // ── Fetch from Supabase (count + page slice) ──────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Helper to apply identical filters to both count and data queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const applyFilters = (query: any) => {
        let q = query;
        if (urlCity !== "All Cities") {
          q = q.eq("city", urlCity);
        }
        if (urlCategory !== "All") {
          q = q.eq("category", urlCategory);
        }
        if (selectedType !== "All Types") {
          q = q.eq("event_type", selectedType);
        }
        if (selectedPrice === "Free") {
          q = q.or("fee.ilike.free,fee.eq.0,fee.is.null");
        } else if (selectedPrice === "Paid") {
          q = q.not("fee", "ilike", "free").neq("fee", "0").not("fee", "is", null);
        }
        if (selectedMode === "Online") {
          q = q.or("event_type.eq.Webinar,venue_location.ilike.%online%,venue_location.ilike.%zoom%");
        } else if (selectedMode === "Hybrid") {
          q = q.ilike("venue_location", "%hybrid%");
        } else if (selectedMode === "Physical") {
          q = q
            .neq("event_type", "Webinar")
            .not("venue_location", "ilike", "%online%")
            .not("venue_location", "ilike", "%zoom%")
            .not("venue_location", "ilike", "%hybrid%");
        }
        if (selectedDate === "Today") {
          q = q.eq("event_date", TODAY_ISO);
        } else if (selectedDate === "This Week") {
          q = q.gte("event_date", TODAY_ISO).lte("event_date", addDays(TODAY_ISO, 7));
        } else if (selectedDate === "This Month") {
          q = q.gte("event_date", TODAY_ISO).lte("event_date", addDays(TODAY_ISO, 30));
        }
        return q;
      };

      // 1. Cheap count query — no rows returned, includes active filters
      let countQuery = supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "Approved");
      countQuery = applyFilters(countQuery);

      const { count, error: countErr } = await countQuery;
      if (countErr) throw countErr;
      const total = count ?? 0;
      setTotalCount(total);

      // 2. Fetch only the current page's 10 rows
      const targetPage = Math.max(1, urlPage);
      const maxPages = Math.max(1, Math.ceil(total / EVENTS_PER_PAGE));
      const effectivePage = Math.min(targetPage, maxPages);
      const from = (effectivePage - 1) * EVENTS_PER_PAGE;
      const to = effectivePage * EVENTS_PER_PAGE - 1;

      let dataQuery = supabase
        .from("events")
        .select("*")
        .eq("status", "Approved")
        .order("event_date", { ascending: true })
        .range(from, to);
      dataQuery = applyFilters(dataQuery);

      const { data, error } = await dataQuery;
      if (error) throw error;
      setPageEvents((data || []).map(mapDbRow));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load events.";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [urlCity, urlCategory, urlPage, selectedType, selectedDate, selectedPrice, selectedMode]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Safety Fallback: Redirect logged-in users with no primary_city to /onboarding ──
  useEffect(() => {
    async function checkUserOnboarding() {
      // Prevent redirect loop if user chose "Skip for now" during this session
      if (typeof window !== "undefined" && sessionStorage.getItem("onboarding_prompted")) {
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("primary_city")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!profile?.primary_city) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("onboarding_prompted", "true");
            }
            router.push("/onboarding");
          }
        }
      } catch {
        // Ignore errors gracefully to avoid blocking page view
      }
    }

    checkUserOnboarding();
  }, [router]);

  // ── Deep-link: open modal from ?event=<id> on first data load ────────────────
  useEffect(() => {
    if (loading || pageEvents.length === 0 || deepLinkHandled.current) return;
    const eventId = searchParams.get("event");
    if (!eventId) return;
    deepLinkHandled.current = true;
    const found = pageEvents.find((e) => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
    } else {
      // Event was deleted or doesn't exist — clear the param and show toast
      const params = new URLSearchParams(searchParams.toString());
      params.delete("event");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setEventNotFoundToast(true);
      setTimeout(() => setEventNotFoundToast(false), 4000);
    }
  }, [loading, pageEvents, searchParams, pathname, router]);

  // ── Client-side filter on the current 10-row page slice ──────────────────────
  // city & category are already filtered server-side; these apply locally.
  const filteredEvents = useMemo(() => {
    const todayStart = TODAY_ISO;
    const weekEnd = addDays(TODAY_ISO, 7);
    const monthEnd = addDays(TODAY_ISO, 30);

    return pageEvents.filter((event) => {
      // Event type filter
      if (selectedType !== "All Types" && event.event_type !== selectedType) return false;

      // Price filter
      if (selectedPrice === "Free") {
        const fee = event.fee || "";
        const isFree = !fee || fee.toLowerCase() === "free" || fee === "0";
        if (!isFree) return false;
      } else if (selectedPrice === "Paid") {
        const fee = event.fee || "";
        const isFree = !fee || fee.toLowerCase() === "free" || fee === "0";
        if (isFree) return false;
      }

      // Mode filter
      if (selectedMode !== "Any Mode" && event.mode !== selectedMode) return false;

      // Date filter
      if (selectedDate === "Today" && event.event_date !== todayStart) return false;
      if (selectedDate === "This Week" &&
        (event.event_date < todayStart || event.event_date > weekEnd)) return false;
      if (selectedDate === "This Month" &&
        (event.event_date < todayStart || event.event_date > monthEnd)) return false;

      // Sidebar: Audience filter
      if (sidebarFilters.audience.length > 0) {
        const eventAudience = (event.tags || []).map((t) => t.toLowerCase());
        const matches = sidebarFilters.audience.some((a) =>
          eventAudience.some((ea) => ea.includes(a.toLowerCase()))
        );
        if (!matches) return false;
      }

      // Sidebar: Level filter
      if (sidebarFilters.level.length > 0) {
        const eventTags = (event.tags || []).map((t) => t.toLowerCase());
        const matches = sidebarFilters.level.some((l) =>
          eventTags.some((et) => et.includes(l.toLowerCase()))
        );
        if (!matches) return false;
      }

      // Sidebar: Highlights filter
      if (sidebarFilters.highlights.length > 0) {
        const eventTags = (event.tags || []).map((t) => t.toLowerCase());
        const hasCert = event.certificate;
        const matches = sidebarFilters.highlights.some((h) => {
          if (h === "Certificate") return hasCert;
          return eventTags.some((et) => et.includes(h.toLowerCase()));
        });
        if (!matches) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          event.title.toLowerCase().includes(q) ||
          event.organizer_name.toLowerCase().includes(q) ||
          event.city.toLowerCase().includes(q) ||
          event.category.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [pageEvents, selectedDate, selectedType, selectedPrice, selectedMode, sidebarFilters, searchQuery]);

  // ── Pagination derived values ─────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / EVENTS_PER_PAGE));
  const safePage = Math.min(urlPage, totalPages);
  const startIndex = (safePage - 1) * EVENTS_PER_PAGE; // global row offset for display

  // "Showing X of N" counter
  const currentVisibleCount = filteredEvents.length;

  // City label
  const cityLabel = urlCity === "All Cities" ? "All Events" : `${urlCity} Events`;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function resetFilters() {
    setSearchQuery("");
    setSelectedDate("All");
    setSelectedType("All Types");
    setSelectedPrice("Any Price");
    setSelectedMode("Any Mode");
    setSidebarFilters(DEFAULT_SIDEBAR);
    pushParams({ city: "Karachi", category: "All", page: 1 });
  }

  function handleCityChange(city: string) {
    setSearchQuery("");
    setSelectedDate("All");
    setSelectedType("All Types");
    setSelectedPrice("Any Price");
    setSelectedMode("Any Mode");
    setSidebarFilters(DEFAULT_SIDEBAR);
    pushParams({ city, category: "All", page: 1 });
  }

  function handleCategoryPill(cat: EventCategory | "All") {
    // Reset to page 1 whenever category changes
    pushParams({ category: cat, page: 1 });
  }

  function handleTypeChange(type: string) {
    setSelectedType(type);
    if (urlPage !== 1) {
      pushParams({ page: 1 });
    }
  }

  function handlePriceChange(price: string) {
    setSelectedPrice(price);
    if (urlPage !== 1) {
      pushParams({ page: 1 });
    }
  }

  function handleModeChange(mode: string) {
    setSelectedMode(mode);
    if (urlPage !== 1) {
      pushParams({ page: 1 });
    }
  }

  function handleDatePill(d: DateFilter) {
    setSelectedDate(d);
    if (urlPage !== 1) {
      pushParams({ page: 1 });
    }
  }

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    pushParams({ page: clamped });
  }

  // ── Event open/close with URL sync ───────────────────────────────────────────
  function openEvent(event: Event) {
    setSelectedEvent(event);
    const params = new URLSearchParams(searchParams.toString());
    params.set("event", event.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeEvent() {
    setSelectedEvent(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("event");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Re-expose currentPage alias so JSX can reference it cleanly
  const currentPage = safePage;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Announcement Bar ─────────────────────────────────────────────────── */}
      {showAnnouncement && (
        <AnnouncementBar onClose={() => setShowAnnouncement(false)} />
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Title Section */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">
            Pakistan Event Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1 md:mt-1.5">
            One place for competitions, hackathons, conferences, workshops and meetups nationwide.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button className="px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer">
            TASKS
          </button>
          <Link
            href="/submit"
            className="px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer inline-flex items-center justify-center"
          >
            SUBMIT EVENT
          </Link>
        </div>

        {/* City Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pb-3 border-b border-slate-300 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">City:</span>
            <CityCombobox value={selectedCity} onChange={handleCityChange} />
          </div>

          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cityLabel}</span>
        </div>

        {/* Search Bar + Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          {/* Search input */}
          <input
            type="text"
            id="event-search"
            placeholder="Search events, organizers, keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="flex-1 px-3 py-2 text-sm border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa] placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors min-w-0"
            style={{ borderRadius: 0 }}
          />

          {/* Filter controls */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <CustomDropdown
              value={selectedType}
              options={TYPE_OPTIONS}
              onChange={handleTypeChange}
              ariaLabel="Filter by event type"
            />

            <CustomDropdown
              value={selectedPrice}
              options={PRICE_OPTIONS}
              onChange={handlePriceChange}
              ariaLabel="Filter by price"
            />

            <CustomDropdown
              value={selectedMode}
              options={MODE_OPTIONS}
              onChange={handleModeChange}
              ariaLabel="Filter by mode"
            />

            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-sm cursor-pointer h-10 w-full sm:w-[160px] flex items-center justify-center"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Divider above categories */}
        <div className="border-b border-slate-300 dark:border-slate-700/80 my-4" />

        {/* Category Filters */}
        <div className="flex flex-nowrap md:flex-wrap overflow-x-auto scrollbar-hide items-center gap-4 text-sm mb-4 pb-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0 whitespace-nowrap">Category:</span>
          {CATEGORY_PILLS.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryPill(cat)}
                className={`shrink-0 whitespace-nowrap transition-colors cursor-pointer border-none bg-transparent p-0 text-[#186BA7] dark:text-[#60a5fa] ${isActive
                  ? "underline font-semibold decoration-[#186BA7] dark:decoration-[#60a5fa]"
                  : "no-underline hover:underline font-normal"
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Date Filters */}
        <div className="flex flex-nowrap md:flex-wrap overflow-x-auto scrollbar-hide items-center gap-4 text-sm mt-4 mb-6 pb-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0 whitespace-nowrap">Date:</span>
          {DATE_PILLS.map((d) => {
            const isActive = selectedDate === d;
            return (
              <button
                key={d}
                onClick={() => handleDatePill(d)}
                className={`shrink-0 whitespace-nowrap transition-colors cursor-pointer border-none bg-transparent p-0 text-[#186BA7] dark:text-[#60a5fa] ${isActive
                  ? "underline font-semibold decoration-[#186BA7] dark:decoration-[#60a5fa]"
                  : "no-underline hover:underline font-normal"
                  }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* ── Mobile: Filters toggle button ──────────────────────────────────── */}
        <div className="md:hidden mb-3">
          <button
            onClick={() => setMobileSidebarOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="16" y2="12" />
              <line x1="4" y1="18" x2="12" y2="18" />
            </svg>
            {mobileSidebarOpen ? "Hide Filters" : "Show Filters"}
          </button>

          {mobileSidebarOpen && (
            <div className="mt-3">
              <Sidebar filters={sidebarFilters} onFiltersChange={(f) => { setSidebarFilters(f); }} />
            </div>
          )}
        </div>

        {/* ── Two-Column Layout ─────────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Left Sidebar — desktop only */}
          <aside className="hidden md:block w-[240px] flex-shrink-0">
            <Sidebar filters={sidebarFilters} onFiltersChange={(f) => { setSidebarFilters(f); }} />
          </aside>

          {/* Right: Event count + Table + Pagination */}
          <div className="flex-1 min-w-0">
            {/* Loading / Error states */}
            {loading && (
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151d2e] py-16 text-center rounded-t-md">
                <p className="text-slate-400 dark:text-slate-300 text-sm font-medium">Loading events…</p>
              </div>
            )}

            {!loading && fetchError && (
              <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 py-8 px-4 text-center rounded-t-md">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{fetchError}</p>
                <button
                  onClick={fetchEvents}
                  className="mt-3 text-xs text-red-500 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !fetchError && (
              <div ref={listContainerRef} className="scroll-mt-4">
                <p className="text-sm text-slate-500 font-medium mb-2.5">
                  Showing{" "}
                  <span className="text-slate-800 dark:text-slate-100 font-semibold">
                    {currentVisibleCount}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-800 dark:text-slate-100 font-semibold">
                    {totalCount}
                  </span>{" "}
                  events
                </p>

                {/* Data Table */}
                <EventsTable
                  events={filteredEvents}
                  todayISO={TODAY_ISO}
                  startIndex={startIndex}
                  onEventClick={openEvent}
                />

                {/* ── Pagination ─────────────────────────────────────────────────── */}
                {totalCount > EVENTS_PER_PAGE && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Event Details Modal ────────────────────────────────────────────── */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          todayISO={TODAY_ISO}
          onClose={closeEvent}
        />
      )}

      {/* ── Event Not Found Toast ───────────────────────────────────────────── */}
      {eventNotFoundToast && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white text-sm px-5 py-3 rounded-md shadow-lg animate-fade-in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-amber-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          This event is no longer available or may have been removed.
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

// ── Page export — wraps inner component in Suspense (required for useSearchParams) ─
export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}

// ── Sub-component: modern pagination ────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  // Build the page number list with ellipsis logic
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
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
  const btnActive =
    "bg-[#186BA7] text-white border-[#186BA7] font-semibold";
  const btnDisabled =
    "opacity-40 cursor-not-allowed pointer-events-none";

  return (
    <div className="mt-5 flex items-center justify-center gap-2 select-none">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnDefault} ${currentPage === 1 ? btnDisabled : ""}`}
        aria-label="Previous page"
      >
        &#8249;
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`${btnBase} ${currentPage === p ? btnActive : btnDefault
              }`}
            aria-current={currentPage === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
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
