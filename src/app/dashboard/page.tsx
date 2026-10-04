"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityCombobox from "@/components/CityCombobox";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface SavedEventItem {
  id: string;
  event_id: string;
  events?: {
    id: string;
    event_name: string;
    event_date: string;
    city: string;
    organizer_name: string;
  } | null;
}

interface SubmissionItem {
  id: string;
  event_name: string;
  event_date: string;
  status: string | null;
  city: string;
  review_notes?: string | null;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryCity, setPrimaryCity] = useState("Karachi");
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Tabs - initialized based on ?tab= URL parameter
  const initialTab =
    searchParams.get("tab") === "submissions"
      ? "My Submissions"
      : "Saved Events";
  const [activeTab, setActiveTab] = useState<
    "Saved Events" | "My Submissions" | "Settings"
  >(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "submissions") {
      setActiveTab("My Submissions");
    } else if (tab === "saved") {
      setActiveTab("Saved Events");
    }
  }, [searchParams]);

  // Saved events state
  const [savedEvents, setSavedEvents] = useState<SavedEventItem[]>([]);
  const [totalSavedCount, setTotalSavedCount] = useState<number | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState<number | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Clean data fetching query without messy fallbacks
  const fetchSavedEvents = async (userId: string) => {
    setIsLoadingEvents(true);
    try {
      const { count } = await supabase
        .from("saved_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      setTotalSavedCount(count ?? 0);

      const { data, error } = await supabase
        .from("saved_events")
        .select("id, event_id, events (id, event_name, event_date, city, organizer_name)")
        .eq("user_id", userId)
        .limit(10);

      if (!error && data) {
        const formatted: SavedEventItem[] = (
          data as unknown as Array<{
            id: string;
            event_id: string;
            events: SavedEventItem["events"] | SavedEventItem["events"][];
          }>
        ).map((item) => ({
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
  };

  // Fetch submissions submitted by current user
  const fetchSubmissions = async (userId: string) => {
    setIsLoadingSubmissions(true);
    try {
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("organizer_id", userId);
      setTotalSubmissionsCount(count ?? 0);

      const { data, error } = await supabase
        .from("events")
        .select("id, event_name, event_date, status, city, review_notes")
        .eq("organizer_id", userId)
        .order("event_date", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching submissions:", error);
        setSubmissions([]);
      } else if (data) {
        setSubmissions(data as SubmissionItem[]);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

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

        // Fetch saved events
        fetchSavedEvents(currentUser.id);

        // Fetch submissions
        fetchSubmissions(currentUser.id);
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUserData();
  }, [router]);

  // Handle Unsave
  const handleUnsave = async (id: string) => {
    setUnsavingId(id);
    try {
      const { error } = await supabase.from("saved_events").delete().eq("id", id);
      if (!error) {
        setSavedEvents((prev) => prev.filter((item) => item.id !== id));
        setTotalSavedCount((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
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

  // Format date like "Oct 5"
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

  const savedCountDisplay =
    totalSavedCount !== null && totalSavedCount > 0
      ? `${savedEvents.length}/${totalSavedCount}`
      : `${savedEvents.length}`;

  const submissionsCountDisplay =
    totalSubmissionsCount !== null && totalSubmissionsCount > 0
      ? `${submissions.length}/${totalSubmissionsCount}`
      : `${submissions.length}`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* ── Top Profile Header ───────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-t-sm rounded-b-none p-4 sm:p-6 bg-white mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left Side: Avatar + Name & Email */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 text-lg sm:w-12 sm:h-12 sm:text-xl rounded-full bg-[#186BA7] flex items-center justify-center text-white font-medium flex-shrink-0">
                    {initial}
                  </div>
                  <div>
                    <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
                      {fullName}
                    </h1>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Right Side: Primary City via CityCombobox */}
                <div className="flex flex-col items-start sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <label className="text-xs font-bold text-slate-900">
                    Primary city
                  </label>
                  <div className="w-full sm:w-72">
                    <CityCombobox
                      selectedCity={primaryCity}
                      onCityChange={handleCityChange}
                      className="w-full !rounded-sm !h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Navigation Tabs ──────────────────────────────────────────── */}
            <div className="flex flex-row w-full gap-2 mb-6">
              {(["Saved Events", "My Submissions", "Settings"] as const).map(
                (tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-initial text-center px-2 py-2 sm:px-4 text-xs sm:text-sm rounded-none transition-colors duration-200 cursor-pointer border ${isActive
                        ? "bg-slate-100 text-slate-900 border-slate-400 font-semibold"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                    >
                      {tab === "My Submissions" ? (
                        <>
                          <span className="hidden sm:inline">My Submissions</span>
                          <span className="sm:hidden">Submissions</span>
                        </>
                      ) : (
                        tab
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* ── Tab Content: Saved Events ────────────────────────────────── */}
            {activeTab === "Saved Events" && (
              <section aria-labelledby="saved-events-heading">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2
                    id="saved-events-heading"
                    className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-1.5"
                  >
                    <span>Saved Events</span>
                    <span className="text-slate-500 font-normal text-xs sm:text-sm">
                      ({savedCountDisplay})
                    </span>
                  </h2>
                  <Link
                    href="/saved-events"
                    className="text-xs sm:text-sm font-medium text-[#186BA7] hover:underline flex items-center gap-1 whitespace-nowrap flex-shrink-0"
                  >
                    View all saved events &rarr;
                  </Link>
                </div>

                {/* Table structure */}
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
                            const eventTitle =
                              item.events?.event_name || "Untitled Event";
                            const eventDate = formatDate(
                              item.events?.event_date
                            );
                            const city = item.events?.city || "Pakistan";
                            const organizer =
                              item.events?.organizer_name || "Organizer";
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
                                      className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium border border-slate-300 rounded-sm bg-white hover:bg-slate-100 cursor-pointer transition-colors text-[#DC2626] ${unsavingId === item.id
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                        }`}
                                    >
                                      {unsavingId === item.id
                                        ? "Unsaving..."
                                        : "Unsave"}
                                    </button>
                                    {eventId ? (
                                      <Link
                                        href={`/?event=${eventId}`}
                                        className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium border border-slate-300 rounded-sm bg-white hover:bg-slate-100 cursor-pointer transition-colors text-slate-900 inline-flex items-center justify-center"
                                      >
                                        View
                                      </Link>
                                    ) : (
                                      <button
                                        type="button"
                                        className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium border border-slate-300 rounded-sm bg-white hover:bg-slate-100 cursor-pointer transition-colors text-slate-900 inline-flex items-center justify-center"
                                      >
                                        View
                                      </button>
                                    )}
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
              </section>
            )}

            {/* ── Tab Content: My Submissions ─────────────────────────────── */}
            {activeTab === "My Submissions" && (
              <section aria-labelledby="my-submissions-heading">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2
                    id="my-submissions-heading"
                    className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-1.5"
                  >
                    <span>My Submissions</span>
                    <span className="text-slate-500 font-normal text-xs sm:text-sm">
                      ({submissionsCountDisplay})
                    </span>
                  </h2>
                  <Link
                    href="/my-submissions"
                    className="text-xs sm:text-sm font-medium text-[#186BA7] hover:underline flex items-center gap-1 whitespace-nowrap flex-shrink-0"
                  >
                    View all submissions &rarr;
                  </Link>
                </div>

                {/* Table structure */}
                <div className="border border-slate-200 rounded-t-sm rounded-b-none overflow-hidden bg-white shadow-sm">
                  {isLoadingSubmissions ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      Loading your submissions...
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-sm text-slate-500 mb-3">
                        You have not submitted any events yet.
                      </p>
                      <Link
                        href="/submit"
                        className="inline-block text-xs sm:text-sm font-semibold border border-slate-300 bg-gray-100 text-slate-900 px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors"
                      >
                        Submit an Event
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
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 pr-6 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {submissions.map((item) => {
                            const eventTitle = item.event_name || "Untitled Event";
                            const eventDate = formatDate(item.event_date);
                            const city = item.city || "Pakistan";
                            const rawStatus = (item.status || "Pending").trim();
                            const lowerStatus = rawStatus.toLowerCase();

                            const isApproved = lowerStatus === "approved";
                            const isPending = lowerStatus === "pending";
                            const isNeedsRevision =
                              lowerStatus === "needs revision" ||
                              lowerStatus === "needs_revision" ||
                              lowerStatus === "revision";
                            const isRejected = lowerStatus === "rejected";

                            const badgeCls = isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : isNeedsRevision
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : isRejected
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-slate-100 text-slate-700 border-slate-300";

                            const badgeLabel: React.ReactNode = isApproved
                              ? "Approved"
                              : isPending
                                ? "Pending"
                                : isNeedsRevision
                                  ? (
                                    <>
                                      Needs <span className="block sm:inline">Revision</span>
                                    </>
                                  )
                                  : isRejected
                                    ? "Rejected"
                                    : rawStatus;

                            return (
                              <React.Fragment key={item.id}>
                                <tr
                                  className="hover:bg-slate-50/70 transition-colors"
                                >
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    <div>{eventTitle}</div>
                                    <div className="sm:hidden text-xs text-slate-500 font-normal mt-1">
                                      {eventDate}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap hidden sm:table-cell align-top">
                                    {eventDate}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell align-top">
                                    {city}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                    <span
                                      className={`inline-block text-center text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-1.5 font-medium rounded-sm border leading-tight ${badgeCls}`}
                                    >
                                      {badgeLabel}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 pr-6 text-left whitespace-nowrap min-w-[100px] align-top">
                                    <Link
                                      href={`/submit?edit=${item.id}`}
                                      className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-sm bg-white text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Edit
                                    </Link>
                                  </td>
                                </tr>
                                {isNeedsRevision && item.review_notes && (
                                  <tr key={`${item.id}-feedback`} className="border-t-0 bg-transparent">
                                    <td colSpan={5} className="px-4 pb-3 pt-0 border-t-0">
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 pr-4 sm:pr-6 mt-2 mb-3 shadow-sm">
                                        <p className="font-bold text-orange-900 text-sm mb-2">Reviewer feedback:</p>
                                        <p className="text-orange-800 text-sm leading-relaxed break-words">{item.review_notes}</p>
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
              </section>
            )}

            {/* Settings Tab: Empty div per requirements */}
            {activeTab === "Settings" && (
              <div className="border border-slate-200 rounded-sm p-8 bg-white"></div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white text-slate-900">
          <Navbar />
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="flex items-center justify-center py-20 text-sm text-slate-500">
              Loading...
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
