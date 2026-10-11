"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const audienceOptions = [
  "Open to All",
  "Students",
  "Professionals",
] as const;

const levelOptions = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "All Levels",
] as const;

const highlightsOptions = [
  "Certificate",
  "With Prizes",
] as const;

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div
        className={`w-3.5 h-3.5 rounded-[2px] flex items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-slate-800 dark:peer-focus-visible:ring-white peer-focus-visible:ring-offset-1 shrink-0 ${
          checked
            ? "bg-slate-800 border-slate-800 text-white"
            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        }`}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2.5 7 5.5 10 11.5 4" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors select-none">
        {label}
      </span>
    </label>
  );
}

export interface SidebarFilters {
  audience: string[];
  level: string[];
  highlights: string[];
}

interface SidebarProps {
  filters: SidebarFilters;
  onFiltersChange: (filters: SidebarFilters) => void;
}

export default function Sidebar({ filters, onFiltersChange }: SidebarProps) {
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchSavedCount = useCallback(async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("saved_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!error && count !== null) {
        setSavedCount(count);
      }
    } catch (err) {
      console.error("Error fetching saved events count in sidebar:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Fetch initial session & count
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const user = session?.user;
      if (user) {
        setIsLoggedIn(true);
        fetchSavedCount(user.id);
      } else {
        setIsLoggedIn(false);
        setSavedCount(null);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      if (user) {
        setIsLoggedIn(true);
        fetchSavedCount(user.id);
      } else {
        setIsLoggedIn(false);
        setSavedCount(null);
      }
    });

    // Sync on tab focus or when event save/unsave triggers
    const handleRefresh = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user?.id) {
          fetchSavedCount(session.user.id);
        }
      });
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("fehrist:saved_events_changed", handleRefresh);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("fehrist:saved_events_changed", handleRefresh);
    };
  }, [fetchSavedCount]);

  function toggleItem(
    key: keyof SidebarFilters,
    val: string
  ) {
    const current = filters[key];
    const updated = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    onFiltersChange({ ...filters, [key]: updated });
  }

  return (
    <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2e] rounded-t-md shadow-xs transition-colors">
      {/* Audience Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/80">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
          Audience
        </h3>
        <div className="space-y-2.5">
          {audienceOptions.map((opt) => (
            <CheckboxItem
              key={opt}
              label={opt}
              checked={filters.audience.includes(opt)}
              onChange={() => toggleItem("audience", opt)}
            />
          ))}
        </div>
      </div>

      {/* Level Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/80">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
          Level
        </h3>
        <div className="space-y-2.5">
          {levelOptions.map((opt) => (
            <CheckboxItem
              key={opt}
              label={opt}
              checked={filters.level.includes(opt)}
              onChange={() => toggleItem("level", opt)}
            />
          ))}
        </div>
      </div>

      {/* Highlights Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/80">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
          Highlights
        </h3>
        <div className="space-y-2.5">
          {highlightsOptions.map((opt) => (
            <CheckboxItem
              key={opt}
              label={opt}
              checked={filters.highlights.includes(opt)}
              onChange={() => toggleItem("highlights", opt)}
            />
          ))}
        </div>
      </div>

      {/* Saved Events Section */}
      <div className="p-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
          Saved Events
        </h3>
        {isLoggedIn ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              {savedCount !== null ? `${savedCount} saved` : "0 saved"}
            </span>
            <Link
              href="/dashboard?tab=saved"
              className="text-xs sm:text-sm font-medium text-[#186BA7] hover:underline flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            >
              View Saved &rarr;
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            0 saved{" "}
            <span className="text-xs text-slate-400 dark:text-slate-400">
              (Sign in to bookmark events)
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
