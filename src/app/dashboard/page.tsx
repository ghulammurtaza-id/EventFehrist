"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { TOP_CITIES, ALL_CITIES } from "@/components/CityCombobox";
import type { User } from "@supabase/supabase-js";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

interface SavedEventItem {
  id: string;
  event_id?: string;
  event_name?: string;
  event_date?: string;
  city?: string;
  organizer_name?: string;
  events?: {
    id?: string;
    event_name?: string;
    event_date?: string;
    city?: string;
    organizer_name?: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryCity, setPrimaryCity] = useState("Karachi");
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "Saved Events" | "My Submissions" | "Settings"
  >("Saved Events");

  // Saved events state
  const [savedEvents, setSavedEvents] = useState<SavedEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  // Load user & profile
  useEffect(() => {
    async function loadUserData() {
      setIsLoadingUser(true);
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);
        setEmail(currentUser.email || "");

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, primary_city")
          .eq("id", currentUser.id)
          .maybeSingle();

        const name =
          profile?.full_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "User";
        setFullName(name);

        if (profile?.email) {
          setEmail(profile.email);
        }

        if (profile?.primary_city) {
          setPrimaryCity(profile.primary_city);
        }

        // Fetch saved events for user
        fetchSavedEvents(currentUser.id);
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUserData();
  }, [router]);

  // Fetch saved events
  const fetchSavedEvents = async (userId: string) => {
    setIsLoadingEvents(true);
    try {
      // Attempt relational query
      const { data, error } = await supabase
        .from("saved_events")
        .select(`
          id,
          event_id,
          events (
            id,
            event_name,
            event_date,
            city,
            organizer_name
          )
        `)
        .eq("user_id", userId)
        .limit(10);

      if (!error && data) {
        // Normalise in case events is returned as array by Supabase
        const formatted = data.map((item: any) => ({
          id: item.id,
          event_id: item.event_id,
          events: Array.isArray(item.events) ? item.events[0] : item.events,
        }));
        setSavedEvents(formatted);
      } else {
        // Fallback: Fetch raw saved_events then join with events table
        const { data: rawSaved } = await supabase
          .from("saved_events")
          .select("*")
          .eq("user_id", userId)
          .limit(10);

        if (rawSaved && rawSaved.length > 0) {
          const eventIds = rawSaved.map((s: any) => s.event_id).filter(Boolean);
          if (eventIds.length > 0) {
            const { data: evts } = await supabase
              .from("events")
              .select("id, event_name, event_date, city, organizer_name")
              .in("id", eventIds);

            const evtMap = new Map((evts || []).map((e: any) => [e.id, e]));
            setSavedEvents(
              rawSaved.map((s: any) => ({
                id: s.id,
                event_id: s.event_id,
                event_name: s.event_name,
                event_date: s.event_date,
                city: s.city,
                organizer_name: s.organizer_name,
                events: evtMap.get(s.event_id) || null,
              }))
            );
          } else {
            setSavedEvents(rawSaved);
          }
        } else {
          setSavedEvents([]);
        }
      }
    } catch (err) {
      console.error("Error fetching saved events:", err);
      setSavedEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Handle Unsave
  const handleUnsave = async (id: string) => {
    setUnsavingId(id);
    try {
      const { error } = await supabase.from("saved_events").delete().eq("id", id);
      if (!error) {
        setSavedEvents((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error unsaving event:", err);
    } finally {
      setUnsavingId(null);
    }
  };

  // Handle City Change
  const handleCityChange = async (newCity: string) => {
    setPrimaryCity(newCity);
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ primary_city: newCity })
        .eq("id", user.id);
    } catch (err) {
      console.error("Failed to update primary city:", err);
    }
  };

  // Helper to format date like "Oct 5"
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

  const initial = (fullName || email || "U").trim().charAt(0).toUpperCase();

  // Combine top cities and all cities without duplicates
  const cityOptions = Array.from(new Set([...TOP_CITIES, ...ALL_CITIES]));

  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-slate-900 ${inter.className}`}
    >
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* ── Top Profile Header ───────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-sm p-6 sm:p-7 bg-white mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Side: Avatar + Name & Email */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#186BA7] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {fullName}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">{email}</p>
                  </div>
                </div>

                {/* Right Side: Primary City */}
                <div className="flex flex-col sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <label
                    htmlFor="primary-city-select"
                    className="text-xs font-bold text-slate-900"
                  >
                    Primary city
                  </label>
                  <select
                    id="primary-city-select"
                    value={primaryCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-sm bg-white text-slate-900 focus:outline-none focus:border-[#186BA7] cursor-pointer"
                  >
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Navigation Tabs ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-6">
              {(["Saved Events", "My Submissions", "Settings"] as const).map(
                (tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm rounded-sm transition-colors cursor-pointer ${
                        isActive
                          ? "bg-slate-200 text-slate-900 font-bold"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal border border-slate-300"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                }
              )}
            </div>

            {/* ── Tab Content: Saved Events ────────────────────────────────── */}
            {activeTab === "Saved Events" && (
              <section aria-labelledby="saved-events-heading">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2
                    id="saved-events-heading"
                    className="text-lg sm:text-xl font-bold text-slate-900"
                  >
                    Saved Events
                  </h2>
                  <Link
                    href="/saved-events"
                    className="text-xs sm:text-sm font-medium text-[#186BA7] hover:underline flex items-center gap-1"
                  >
                    View all saved events &rarr;
                  </Link>
                </div>

                {/* Table structure */}
                <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-sm">
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
                      <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                            <th className="py-3 px-4">Event Name</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4">Organizer</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {savedEvents.map((item) => {
                            const eventTitle =
                              item.events?.event_name ||
                              item.event_name ||
                              "Untitled Event";
                            const eventDate = formatDate(
                              item.events?.event_date || item.event_date
                            );
                            const city =
                              item.events?.city || item.city || "Pakistan";
                            const organizer =
                              item.events?.organizer_name ||
                              item.organizer_name ||
                              "Organizer";
                            const eventId = item.events?.id || item.event_id;

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {eventTitle}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                  {eventDate}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  {city}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  {organizer}
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-3">
                                  <button
                                    type="button"
                                    disabled={unsavingId === item.id}
                                    onClick={() => handleUnsave(item.id)}
                                    className={`text-[#DC2626] hover:underline font-medium cursor-pointer transition-opacity ${
                                      unsavingId === item.id ? "opacity-50" : ""
                                    }`}
                                  >
                                    {unsavingId === item.id
                                      ? "Unsaving..."
                                      : "Unsave"}
                                  </button>
                                  {eventId ? (
                                    <Link
                                      href={`/?event=${eventId}`}
                                      className="text-slate-900 hover:underline font-medium"
                                    >
                                      View
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      className="text-slate-900 hover:underline font-medium cursor-pointer"
                                    >
                                      View
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Placeholder for My Submissions */}
            {activeTab === "My Submissions" && (
              <div className="border border-slate-200 rounded-sm p-8 text-center text-slate-500 bg-white">
                <p className="text-sm">
                  You can view and manage events you have submitted here.
                </p>
                <Link
                  href="/submit"
                  className="mt-3 inline-block text-xs font-semibold text-[#186BA7] hover:underline"
                >
                  Submit a new event &rarr;
                </Link>
              </div>
            )}

            {/* Placeholder for Settings */}
            {activeTab === "Settings" && (
              <div className="border border-slate-200 rounded-sm p-8 text-center text-slate-500 bg-white">
                <p className="text-sm">
                  Account and notification preferences can be configured here.
                </p>
                <Link
                  href="/update-password"
                  className="mt-3 inline-block text-xs font-semibold text-[#186BA7] hover:underline"
                >
                  Change Password &rarr;
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
