"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// Top 12 major cities in quick dropdown view
export const TOP_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sukkur",
  "Gujranwala",
  "Sialkot",
];

// Complete 126 cities list in Pakistan (alphabetical)
export const ALL_CITIES = [
  "Abbottabad",
  "Arifwala",
  "Astore",
  "Attock",
  "Badin",
  "Bagh",
  "Bahawalnagar",
  "Bahawalpur",
  "Bajaur",
  "Bannu",
  "Barkhan",
  "Bhakkar",
  "Bhimber",
  "Burewala",
  "Chakwal",
  "Chaman",
  "Charsadda",
  "Chilas",
  "Chiniot",
  "Chitral",
  "Dadu",
  "Dalbandin",
  "Daska",
  "Dera Bugti",
  "Dera Ghazi Khan",
  "Dera Ismail Khan",
  "Faisalabad",
  "Ghanche",
  "Ghizer",
  "Ghotki",
  "Gilgit",
  "Gojra",
  "Gujranwala",
  "Gujrat",
  "Gwadar",
  "Hafizabad",
  "Hangu",
  "Haripur",
  "Hattian Bala",
  "Hub",
  "Hunza",
  "Hyderabad",
  "Islamabad",
  "Jacobabad",
  "Jafarabad",
  "Jamshoro",
  "Jaranwala",
  "Jhang",
  "Jhelum",
  "Kabirwala",
  "Kalat",
  "Karachi",
  "Karimabad",
  "Kasur",
  "Khairpur",
  "Khanewal",
  "Kharan",
  "Kharian",
  "Khuzdar",
  "Kohat",
  "Kohlu",
  "Kot Addu",
  "Kotli",
  "Lahore",
  "Lakki Marwat",
  "Larkana",
  "Layyah",
  "Lodhran",
  "Loralai",
  "Mailsi",
  "Mandi Bahauddin",
  "Mansehra",
  "Mardan",
  "Mastung",
  "Matiari",
  "Mian Channu",
  "Mianwali",
  "Mingora",
  "Mirpur",
  "Mirpur Khas",
  "Multan",
  "Muridke",
  "Muzaffarabad",
  "Muzaffargarh",
  "Nankana Sahib",
  "Naseerabad",
  "Naushahro Feroze",
  "Nawabshah",
  "Neelum Valley",
  "Nowshera",
  "Nushki",
  "Okara",
  "Pakpattan",
  "Pano Aqil",
  "Peshawar",
  "Pishin",
  "Quetta",
  "Rahim Yar Khan",
  "Rajanpur",
  "Rawalakot",
  "Rawalpindi",
  "Sahiwal",
  "Sanghar",
  "Sargodha",
  "Sehwan",
  "Shangla",
  "Sheikhupura",
  "Shikarpur",
  "Sialkot",
  "Sibi",
  "Skardu",
  "Sudhanoti",
  "Sukkur",
  "Swabi",
  "Swat",
  "Tando Allahyar",
  "Tank",
  "Tharparkar",
  "Thatta",
  "Toba Tek Singh",
  "Turbat",
  "Umerkot",
  "Vehari",
  "Wazirabad",
  "Zhob",
  "Ziarat",
];

interface CityComboboxProps {
  value?: string;
  onChange?: (city: string) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  className?: string;
}

export default function CityCombobox({
  value: propsValue,
  onChange: propsOnChange,
  selectedCity,
  onCityChange,
  className,
}: CityComboboxProps) {
  const value = propsValue ?? selectedCity ?? "";
  const onChange = propsOnChange ?? onCityChange ?? (() => {});
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (open) setOpen(false);
        if (modalOpen) setModalOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, modalOpen]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
    }
  }, [open]);

  // Filter cities based on query
  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOP_CITIES;
    return ALL_CITIES.filter((city) => city.toLowerCase().includes(q));
  }, [query]);

  const showAllCitiesOption = useMemo(() => {
    if (!query.trim()) return true;
    return "all cities".includes(query.trim().toLowerCase());
  }, [query]);

  const handleSelect = useCallback(
    (city: string) => {
      onChange(city);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  return (
    <>
      <div ref={containerRef} className={`relative text-left ${className || "inline-block"}`}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`${
            className
              ? "h-10 w-full flex items-center justify-between gap-1.5 px-3 text-sm border border-slate-300 bg-white text-slate-800 rounded-none hover:border-slate-400 focus:outline-none focus:border-[#186BA7] cursor-pointer transition-colors"
              : "h-8 min-w-[130px] max-w-[170px] flex items-center justify-between gap-1.5 px-2.5 text-sm border border-slate-300 bg-white text-slate-800 rounded-sm hover:border-slate-400 focus:outline-none focus:border-[#186BA7] cursor-pointer transition-colors"
          }`}
        >
          <span className="truncate font-medium">{value}</span>
          <svg
            suppressHydrationWarning
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Backdrop for mobile drawer */}
        {open && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Popover: bottom-sheet on mobile, anchored popover on desktop */}
        {open && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-300 shadow-2xl rounded-t-lg max-h-[75vh] flex flex-col sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-1 sm:w-full sm:min-w-[240px] sm:max-h-[390px] sm:rounded-sm sm:border sm:border-slate-300 sm:shadow-lg transition-colors">
            {/* Mobile Sheet Handle */}
            <div className="sm:hidden pt-2.5 pb-1 flex flex-col items-center">
              <div className="w-10 h-1 bg-slate-300 rounded-full mb-2" />
              <div className="w-full flex items-center justify-between px-4 pb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select City
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Search Input — seamless, no inner box */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
              <svg
                className="w-3.5 h-3.5 text-slate-400 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city..."
                className="w-full text-sm bg-transparent !border-0 !outline-none !shadow-none focus:!border-0 focus:!outline-none focus:!ring-0 placeholder:text-slate-400 text-slate-800"
                style={{ border: "none", outline: "none", boxShadow: "none" }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Scrollable Options List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 py-1">
              {/* "All Cities" Option */}
              {showAllCitiesOption && (
                <button
                  type="button"
                  onClick={() => handleSelect("All Cities")}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-sm text-left transition-colors cursor-pointer ${
                    value === "All Cities"
                      ? "text-[#186BA7] font-semibold bg-blue-50/70"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>All Cities</span>
                  {value === "All Cities" && (
                    <svg className="w-4 h-4 text-[#186BA7] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}

              {/* Matching / Top Cities */}
              {filteredCities.length > 0 ? (
                <div>
                  {filteredCities.map((city) => {
                    const isSelected = value === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelect(city)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-sm text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "text-[#186BA7] font-semibold bg-blue-50/70"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        {isSelected && (
                          <svg className="w-4 h-4 text-[#186BA7] shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                !showAllCitiesOption && (
                  <div className="px-3 py-6 text-center text-sm text-slate-400">
                    No cities found matching &ldquo;{query}&rdquo;
                  </div>
                )
              )}
            </div>

            {/* Sticky Footer: View all cities */}
            <div className="sticky bottom-0 z-10 bg-slate-50 border-t border-slate-200 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] p-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#186BA7] hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z" />
                </svg>
                View all cities ({ALL_CITIES.length})...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* "View all cities" Full Modal Dialog */}
      {modalOpen && (
        <AllCitiesModal
          selectedCity={value}
          onSelect={(city) => {
            onChange(city);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── All Cities Modal Dialog Component ─────────────────────────────────────────
function AllCitiesModal({
  selectedCity,
  onSelect,
  onClose,
}: {
  selectedCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const [modalSearch, setModalSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return ALL_CITIES;
    return ALL_CITIES.filter((city) => city.toLowerCase().includes(q));
  }, [modalSearch]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white w-full sm:max-w-xl rounded-t-xl sm:rounded-sm border border-slate-300 shadow-2xl max-h-[90vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-slate-900">
              Cities in Pakistan
            </h2>
            <p className="text-xs text-slate-500">
              Select your city to filter events nationwide ({ALL_CITIES.length} available)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-sm hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Search Input — seamless, no inner box */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 flex-shrink-0">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={modalSearch}
            onChange={(e) => setModalSearch(e.target.value)}
            placeholder="Search all 120+ cities..."
            className="flex-1 text-sm bg-transparent !border-0 !outline-none !shadow-none focus:!border-0 focus:!outline-none focus:!ring-0 placeholder:text-slate-400 text-slate-800"
            style={{ border: "none", outline: "none", boxShadow: "none" }}
          />
          {modalSearch && (
            <button
              type="button"
              onClick={() => setModalSearch("")}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Modal List View */}
        <div className="flex-1 overflow-y-auto px-4 my-4">
          {/* Quick Select "All Cities" */}
          <button
            type="button"
            onClick={() => onSelect("All Cities")}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm mb-3 transition-colors cursor-pointer border ${
              selectedCity === "All Cities"
                ? "border-[#186BA7] bg-blue-50 text-[#186BA7] font-semibold"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <span>All Cities (Show nationwide events)</span>
            {selectedCity === "All Cities" && (
              <svg className="w-4 h-4 text-[#186BA7]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Grid of Cities */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No cities match &ldquo;{modalSearch}&rdquo;
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {modalSearch ? `Matching Cities (${filtered.length})` : "Alphabetical List"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {filtered.map((city) => {
                  const isSelected = selectedCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => onSelect(city)}
                      className={`text-left px-2.5 py-1.5 text-sm rounded-sm transition-colors cursor-pointer truncate flex items-center justify-between border ${
                        isSelected
                          ? "border-[#186BA7] bg-blue-50 text-[#186BA7] font-semibold"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="truncate">{city}</span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-[#186BA7] shrink-0 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>Showing {filtered.length} of {ALL_CITIES.length} cities</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded-sm text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}