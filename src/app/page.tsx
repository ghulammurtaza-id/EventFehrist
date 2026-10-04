"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  approvedEvents,
  EVENT_TYPES,
  type Event,
  type EventCategory,
} from "@/lib/mockData";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import EventsTable from "@/components/EventsTable";
import CityCombobox from "@/components/CityCombobox";
import EventDetailsModal from "@/components/EventDetailsModal";

// Today's date in YYYY-MM-DD (PKT) — used for status badge derivation.
// Evaluated once at module level to avoid hydration mismatch.
const TODAY_ISO = new Date().toISOString().split("T")[0];


// Category pills shown in the filter row
const CATEGORY_PILLS: (EventCategory | "All")[] = [
  "All",
  "Technology",
  "Business",
  "Arts & Culture",
  "Music",
  "Gaming",
  "Health & Wellness",
  "Sports",
  "Food & Lifestyle",
  "Education",
];

// Date filter pills
const DATE_PILLS = ["All", "Today", "This Week", "This Month", "Custom"] as const;
type DateFilter = (typeof DATE_PILLS)[number];

// Helper — returns ISO date YYYY-MM-DD n days from today
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function HomePage() {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("Karachi");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "All">("All");
  const [selectedDate, setSelectedDate] = useState<DateFilter>("All");
  const [selectedType, setSelectedType] = useState<string>("All Types");

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE_COUNT = 10;

  // ── Derived: filtered events ─────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const todayStart = TODAY_ISO;
    const weekEnd = addDays(TODAY_ISO, 7);
    const monthEnd = addDays(TODAY_ISO, 30);

    return approvedEvents.filter((event) => {
      // City filter
      if (selectedCity !== "All Cities" && event.city !== selectedCity) return false;

      // Category filter
      if (selectedCategory !== "All" && event.category !== selectedCategory) return false;

      // Event type filter
      if (selectedType !== "All Types" && event.event_type !== selectedType) return false;

      // Date filter
      if (selectedDate === "Today" && event.event_date !== todayStart) return false;
      if (selectedDate === "This Week" && (event.event_date < todayStart || event.event_date > weekEnd)) return false;
      if (selectedDate === "This Month" && (event.event_date < todayStart || event.event_date > monthEnd)) return false;

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
  }, [selectedCity, selectedCategory, selectedDate, selectedType, searchQuery]);

  // ── Derived: paginated slice ─────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE_COUNT));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * EVENTS_PER_PAGE_COUNT;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE_COUNT);


  // City label
  const cityLabel =
    selectedCity === "All Cities" ? "All Events" : `${selectedCity} Events`;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function resetFilters() {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDate("All");
    setSelectedType("All Types");
    setCurrentPage(1);
  }

  function handleCityChange(city: string) {
    setSelectedCity(city);
    setCurrentPage(1);
  }

  function handleCategoryPill(cat: EventCategory | "All") {
    setSelectedCategory(cat);
    setCurrentPage(1);
  }

  function handleDatePill(d: DateFilter) {
    setSelectedDate(d);
    setCurrentPage(1);
  }

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(clamped);
  }

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
              setCurrentPage(1);
            }}
            className="flex-1 px-3 py-2 text-sm border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa] placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors min-w-0"
            style={{ borderRadius: 0 }}
          />

          {/* Filter controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2 outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa] cursor-pointer text-slate-700 dark:text-slate-200"
              style={{ borderRadius: 0 }}
            >
              <option>All Types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              className="text-sm border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2 outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa] cursor-pointer text-slate-700 dark:text-slate-200"
              style={{ borderRadius: 0 }}
            >
              <option>Any Price</option>
              <option>Free</option>
              <option>Paid</option>
            </select>

            <select
              className="text-sm border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2 outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa] cursor-pointer text-slate-700 dark:text-slate-200"
              style={{ borderRadius: 0 }}
            >
              <option>Any Mode</option>
              <option>Physical</option>
              <option>Online</option>
              <option>Hybrid</option>
            </select>

            <button
              className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer"
            >
              Filter
            </button>

            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer"
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
              <Sidebar />
            </div>
          )}
        </div>

        {/* ── Two-Column Layout ─────────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Left Sidebar — desktop only */}
          <aside className="hidden md:block w-[240px] flex-shrink-0">
            <Sidebar />
          </aside>

          {/* Right: Event count + Table + Pagination */}
          <div className="flex-1 min-w-0">
            {/* Showing N events */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2.5">
              Showing{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {paginatedEvents.length}
              </span>{" "}
              events
              {filteredEvents.length > EVENTS_PER_PAGE_COUNT && (
                <span className="text-slate-400 dark:text-slate-500">
                  {" "}
                  (of {filteredEvents.length} total)
                </span>
              )}
            </p>

            {/* Data Table */}
            <EventsTable
              events={paginatedEvents}
              todayISO={TODAY_ISO}
              startIndex={startIndex}
              onEventClick={setSelectedEvent}
            />

            {/* ── Pagination ─────────────────────────────────────────────────── */}
            {filteredEvents.length > EVENTS_PER_PAGE_COUNT && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            )}
          </div>
        </div>
      </main>

      {/* ── Event Details Modal ────────────────────────────────────────────── */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          todayISO={TODAY_ISO}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
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
