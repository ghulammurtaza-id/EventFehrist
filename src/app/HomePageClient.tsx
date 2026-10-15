"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  EVENT_TYPES,
  type Event,
  type EventCategory,
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

import { mapDbRow, type DbEvent } from "@/lib/mappers";
import { setUserCity } from "@/app/actions/city";
import type { Announcement } from "@/app/actions/announcements";
import { getTodayPKT } from "@/lib/dateUtils";

// Today's date in YYYY-MM-DD (PKT) — used for status badge derivation.
export const TODAY_ISO = getTodayPKT();

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
const DATE_PILLS = ["All", "Today", "This Week", "This Month", "Next Month"] as const;
type DateFilter = (typeof DATE_PILLS)[number];

// Filter options for custom dropdowns
const TYPE_OPTIONS = ["All Types", ...EVENT_TYPES] as const;
const PRICE_OPTIONS = ["Any Price", "Free", "Paid"] as const;
const MODE_OPTIONS = ["Any Mode", "Physical", "Online", "Hybrid"] as const;

// Helper — returns ISO date YYYY-MM-DD n days from today (UTC-safe to prevent timezone offset skew)
function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().split("T")[0];
}

// Helper — returns start (1st day) and end (last day) ISO date strings for the next month
function getNextMonthRange(iso: string): { start: string; end: string } {
  const parts = iso.split("-").map(Number);
  const year = parts[0];
  const month = parts[1]; // 1-indexed (1-12)
  const nextMonthStart = new Date(year, month, 1);
  const nextYear = nextMonthStart.getFullYear();
  const nextMonthNum = nextMonthStart.getMonth() + 1;

  const start = `${nextYear}-${String(nextMonthNum).padStart(2, "0")}-01`;
  const nextMonthEnd = new Date(nextYear, nextMonthNum, 0);
  const end = `${nextYear}-${String(nextMonthNum).padStart(2, "0")}-${String(nextMonthEnd.getDate()).padStart(2, "0")}`;

  return { start, end };
}

// Sidebar defaults
const DEFAULT_SIDEBAR: SidebarFilters = { audience: [], level: [], highlights: [] };

export interface HomePageClientProps {
  initialCity?: string;
  initialEvents?: Event[];
  initialTotalCount?: number;
  shouldSetDefaultCookie?: boolean;
  announcement?: Announcement | null;
}

// ── Inner component (needs Suspense because it calls useSearchParams) ────────
function HomePageInner({
  initialCity = "Karachi",
  initialEvents = [],
  initialTotalCount = 0,
  shouldSetDefaultCookie = false,
  announcement,
}: HomePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Data state ────────────────────────────────────────────────────────────────
  // Seed with initial events from server render if available
  const [pageEvents, setPageEvents] = useState<Event[]>(initialEvents);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventNotFoundToast, setEventNotFoundToast] = useState(false);

  // ── Filter state (URL-synced: city, category, page) ──────────────────────────
  // urlCity falls back to resolved initialCity from server instead of hardcoded Karachi
  const urlCity = searchParams.get("city") ?? initialCity;
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
  const deepLinkHandled = useRef(false);
  // ── Race-condition guard: monotonic counter, incremented on every fetch ──
  const latestRequestIdRef = useRef(0);

  // Set default cookie on client if requested by server (fallback scenario)
  useEffect(() => {
    if (shouldSetDefaultCookie && typeof document !== "undefined") {
      document.cookie = "selected_city=Karachi; path=/; max-age=31536000; SameSite=Lax";
    }
  }, [shouldSetDefaultCookie]);

  // ── URL-param helpers ─────────────────────────────────────────────────────────
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

  // Local state for selected city to ensure instant UI update
  const [selectedCityState, setSelectedCityState] = useState(urlCity);

  useEffect(() => {
    setSelectedCityState(urlCity);
    if (urlCity && urlCity !== "All Cities") {
      if (typeof document !== "undefined") {
        document.cookie = `selected_city=${encodeURIComponent(urlCity)}; path=/; max-age=31536000; SameSite=Lax`;
      }
      setUserCity(urlCity).catch(() => {});
    }
  }, [urlCity]);

  const selectedCity = selectedCityState;
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

  // ── Reset pagination to page 1 whenever ANY filter state changes ────────────
  const prevFiltersRef = useRef({
    searchQuery,
    selectedDate,
    selectedType,
    selectedPrice,
    selectedMode,
    sidebarFilters,
  });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const hasFilterChanged =
      prev.searchQuery !== searchQuery ||
      prev.selectedDate !== selectedDate ||
      prev.selectedType !== selectedType ||
      prev.selectedPrice !== selectedPrice ||
      prev.selectedMode !== selectedMode ||
      prev.sidebarFilters !== sidebarFilters;

    if (hasFilterChanged) {
      prevFiltersRef.current = {
        searchQuery,
        selectedDate,
        selectedType,
        selectedPrice,
        selectedMode,
        sidebarFilters,
      };
      if (urlPage !== 1) {
        pushParams({ page: 1 });
      }
    }
  }, [
    searchQuery,
    selectedDate,
    selectedType,
    selectedPrice,
    selectedMode,
    sidebarFilters,
    urlPage,
    pushParams,
  ]);

  // Smooth scroll to top of list when page changes
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (listContainerRef.current) {
      listContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [urlPage]);

  // ── Fetch from Supabase (single dynamic query: filters + order + pagination) ──
  const fetchEvents = useCallback(async () => {
    // ── Race-condition guard: stamp this request and bail if superseded ──
    const requestId = ++latestRequestIdRef.current;

    setLoading(true);
    setFetchError(null);
    try {
      const todayPKT = getTodayPKT();

      // ONE single dynamic query with exact count
      let query = supabase
        .from("events")
        .select("*", { count: "exact" })
        .eq("status", "Approved");

      // ── Step 3: Base condition (Hidden Global Condition: Never show past events in PKT) ──
      query = query.gte("event_date", todayPKT);

      // ── Server-Side Search Filter (ilike query) ──
      if (searchQuery.trim()) {
        query = query.ilike("event_name", `%${searchQuery.trim()}%`);
      }

      // ── City & Category Filters ──
      if (selectedCity !== "All Cities") {
        query = query.eq("city", selectedCity);
      }
      if (urlCategory !== "All") {
        query = query.eq("category", urlCategory);
      }

      // ── Event Type, Price, Mode Filters ──
      if (selectedType !== "All Types") {
        query = query.eq("event_type", selectedType);
      }
      if (selectedPrice === "Free") {
        query = query.or("fee.ilike.free,fee.eq.0,fee.is.null");
      } else if (selectedPrice === "Paid") {
        query = query.not("fee", "ilike", "free").neq("fee", "0").not("fee", "is", null);
      }
      if (selectedMode === "Online") {
        query = query.or("event_type.eq.Webinar,venue_location.ilike.%online%,venue_location.ilike.%zoom%");
      } else if (selectedMode === "Hybrid") {
        query = query.ilike("venue_location", "%hybrid%");
      } else if (selectedMode === "Physical") {
        query = query
          .neq("event_type", "Webinar")
          .not("venue_location", "ilike", "%online%")
          .not("venue_location", "ilike", "%zoom%")
          .not("venue_location", "ilike", "%hybrid%");
      }

      // ── Date Filters (PKT timezone-safe comparisons) ──
      if (selectedDate === "Today") {
        query = query.eq("event_date", todayPKT);
        query = query.or(`registration_deadline.gte.${todayPKT},registration_deadline.is.null`);
      } else if (selectedDate === "This Week") {
        query = query.gte("event_date", todayPKT).lte("event_date", addDays(todayPKT, 7));
        query = query.or(`registration_deadline.gte.${todayPKT},registration_deadline.is.null`);
      } else if (selectedDate === "This Month") {
        query = query.gte("event_date", todayPKT).lte("event_date", addDays(todayPKT, 30));
        query = query.or(`registration_deadline.gte.${todayPKT},registration_deadline.is.null`);
      } else if (selectedDate === "Next Month") {
        const nextMonth = getNextMonthRange(todayPKT);
        query = query.gte("event_date", nextMonth.start).lte("event_date", nextMonth.end);
        query = query.or(`registration_deadline.gte.${todayPKT},registration_deadline.is.null`);
      }

      // ── Server-Side Audience, Level, and Highlights Filters (Guarded against empty arrays) ──
      if (sidebarFilters.audience.length > 0) {
        const audienceQuery = [
          ...new Set([...sidebarFilters.audience, "Open to All"]),
        ];
        query = query.overlaps("audience", audienceQuery);
      }

      if (sidebarFilters.level.length > 0) {
        const levelQuery = [
          ...new Set([...sidebarFilters.level, "All Levels"]),
        ];
        query = query.overlaps("level", levelQuery);
      }

      if (sidebarFilters.highlights.length > 0) {
        query = query.overlaps("highlights", sidebarFilters.highlights);
      }

      // ── Step 2: Sorting Strategy (Urgency + Deterministic with 3rd Tie-Breaker) ──
      query = query
        .order("event_date", { ascending: true })
        .order("registration_deadline", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      // ── Pagination: Applied at the very end of the single query ──
      const targetPage = Math.max(1, urlPage);
      const from = (targetPage - 1) * EVENTS_PER_PAGE;
      const to = from + EVENTS_PER_PAGE - 1;
      query = query.range(from, to);

      // Execute single query
      const { data, count, error } = await query;
      if (error) throw error;

      // ── Discard stale responses: only apply if this is still the latest request ──
      if (requestId !== latestRequestIdRef.current) return;

      setTotalCount(count ?? 0);
      setPageEvents((data || []).map(mapDbRow));
    } catch (err: unknown) {
      // Only surface errors for the latest request
      if (requestId !== latestRequestIdRef.current) return;
      const msg = err instanceof Error ? err.message : "Failed to load events.";
      setFetchError(msg);
    } finally {
      // Only clear loading spinner for the latest request
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    selectedCity,
    urlCategory,
    urlPage,
    searchQuery,
    selectedType,
    selectedDate,
    selectedPrice,
    selectedMode,
    sidebarFilters,
  ]);

  // Initial fetch on mount: Skip if initial server render already provided current default data
  const isFirstDataFetch = useRef(true);
  useEffect(() => {
    if (isFirstDataFetch.current) {
      isFirstDataFetch.current = false;
      const isDefaultState =
        urlCity === initialCity &&
        urlCategory === "All" &&
        urlPage === 1 &&
        !searchQuery.trim() &&
        selectedDate === "All" &&
        selectedType === "All Types" &&
        selectedPrice === "Any Price" &&
        selectedMode === "Any Mode" &&
        sidebarFilters.audience.length === 0 &&
        sidebarFilters.level.length === 0 &&
        sidebarFilters.highlights.length === 0;

      if (isDefaultState && initialEvents.length > 0) {
        return;
      }
    }
    fetchEvents();
  }, [
    fetchEvents,
    initialCity,
    initialEvents.length,
    urlCity,
    urlCategory,
    urlPage,
    searchQuery,
    selectedDate,
    selectedType,
    selectedPrice,
    selectedMode,
    sidebarFilters,
  ]);

  // ── Safety Fallback: Redirect logged-in users with no primary_city to /onboarding ──
  useEffect(() => {
    async function checkUserOnboarding() {
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
      const params = new URLSearchParams(searchParams.toString());
      params.delete("event");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setEventNotFoundToast(true);
      setTimeout(() => setEventNotFoundToast(false), 4000);
    }
  }, [loading, pageEvents, searchParams, pathname, router]);

  // ── Filtered events: search is handled server-side in Supabase query ───────────
  const filteredEvents = pageEvents;

  // ── Pagination derived values ─────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / EVENTS_PER_PAGE));
  const safePage = Math.min(urlPage, totalPages);
  const startIndex = (safePage - 1) * EVENTS_PER_PAGE;

  const currentVisibleCount = filteredEvents.length;
  const cityLabel = urlCity === "All Cities" ? "All Events" : `${urlCity} Events`;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function handleSearchChange(query: string) {
    setSearchQuery(query);
    if (urlPage !== 1) {
      pushParams({ page: 1 });
    }
  }

  function resetFilters() {
    setSelectedCityState("Karachi");
    prevCityRef.current = "Karachi";
    if (typeof document !== "undefined") {
      document.cookie = "selected_city=Karachi; path=/; max-age=31536000; SameSite=Lax";
    }
    setUserCity("Karachi").catch((err) => {
      console.error("Failed to update user city on reset:", err);
    });
    setSearchQuery("");
    setSelectedDate("All");
    setSelectedType("All Types");
    setSelectedPrice("Any Price");
    setSelectedMode("Any Mode");
    setSidebarFilters(DEFAULT_SIDEBAR);
    pushParams({ city: "Karachi", category: "All", page: 1 });
  }

  function handleCityChange(city: string) {
    // 1. Update local React state immediately for snappy UI
    setSelectedCityState(city);
    prevCityRef.current = city;
    setSearchQuery("");
    setSelectedDate("All");
    setSelectedType("All Types");
    setSelectedPrice("Any Price");
    setSelectedMode("Any Mode");
    setSidebarFilters(DEFAULT_SIDEBAR);

    // 2 & 3. Set cookie for guests and update profiles table if logged in via server action
    if (typeof document !== "undefined") {
      document.cookie = `selected_city=${encodeURIComponent(city)}; path=/; max-age=31536000; SameSite=Lax`;
    }
    setUserCity(city).catch((err) => {
      console.error("Failed to update user city on server:", err);
    });

    // 4. Update URL params (page resets to 1) and trigger re-fetch of events list
    pushParams({ city, category: "All", page: 1 });
  }

  function handleCategoryPill(cat: EventCategory | "All") {
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

  function handleSidebarFiltersChange(f: SidebarFilters) {
    setSidebarFilters(f);
    if (urlPage !== 1) {
      pushParams({ page: 1 });
    }
  }

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    pushParams({ page: clamped });
  }

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

  const currentPage = safePage;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <AnnouncementBar announcement={announcement} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 sm:px-8 lg:px-14 py-8">
        <div className="mb-5 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">
            Pakistan Event Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1 md:mt-1.5">
            One place for competitions, hackathons, conferences, workshops and meetups nationwide.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/" className="no-underline">
            <button className="px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer">
              TASKS
            </button>
          </Link>
          <Link
            href="/submit"
            className="px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer inline-flex items-center justify-center"
          >
            SUBMIT EVENT
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-slate-300 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">City:</span>
            <CityCombobox value={selectedCity} onChange={handleCityChange} syncUserCity={true} />
          </div>

          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cityLabel}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            id="event-search"
            placeholder="Search events, organizers, keywords..."
            value={searchQuery}
            onChange={(e) => {
              handleSearchChange(e.target.value);
            }}
            className="flex-1 px-3 py-2 text-sm border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa] placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors min-w-0"
            style={{ borderRadius: 0 }}
          />

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
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

        <div className="border-b border-slate-300 dark:border-slate-700/80 my-5" />

        <div className="flex flex-nowrap md:flex-wrap overflow-x-auto scrollbar-hide items-center gap-5 text-sm mb-5 pb-1">
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

        <div className="flex flex-nowrap md:flex-wrap overflow-x-auto scrollbar-hide items-center gap-5 text-sm mt-5 mb-7 pb-1">
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
              <Sidebar filters={sidebarFilters} onFiltersChange={handleSidebarFiltersChange} />
            </div>
          )}
        </div>

        <div className="flex gap-8 items-start">
          <aside className="hidden md:block w-[260px] flex-shrink-0">
            <Sidebar filters={sidebarFilters} onFiltersChange={handleSidebarFiltersChange} />
          </aside>

          <div className="flex-1 min-w-0">
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

                <EventsTable
                  events={filteredEvents}
                  todayISO={TODAY_ISO}
                  startIndex={startIndex}
                  onEventClick={openEvent}
                />

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

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          todayISO={TODAY_ISO}
          onClose={closeEvent}
        />
      )}

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

      <Footer />
    </div>
  );
}

// Wrap inner component in Suspense because it uses useSearchParams
export default function HomePageClient(props: HomePageClientProps) {
  return (
    <Suspense fallback={null}>
      <HomePageInner {...props} />
    </Suspense>
  );
}

// Sub-component: modern pagination
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
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
  const btnActive =
    "bg-[#186BA7] text-white border-[#186BA7] font-semibold";
  const btnDisabled =
    "opacity-40 cursor-not-allowed pointer-events-none";

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
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
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
