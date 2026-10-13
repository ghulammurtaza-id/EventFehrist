"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmissionsTable from "@/components/SubmissionsTable";
import CityCombobox from "@/components/CityCombobox";
import EventDetailsModal from "@/components/EventDetailsModal";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { Event, EventCategory, EventStatus } from "@/lib/mockData";
import { formatDatePKT } from "@/lib/dateUtils";
import { setUserCity } from "@/app/actions/city";


const DEFAULT_AVATARS = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-5",
  "avatar-6",
  "avatar-7",
  "avatar-8",
];

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
  const [isAdmin, setIsAdmin] = useState(false);

  // Settings Tab state
  const [selectedAvatar, setSelectedAvatar] = useState<string>("avatar-1");
  const [nameInput, setNameInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Security / Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  const [savedPage, setSavedPage] = useState(1);
  const SAVED_PER_PAGE = 10;
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState<number | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const fetchSavedEvents = async (userId: string, page = 1) => {
    setIsLoadingEvents(true);
    try {
      // Single joined query: count + 10-row page slice
      const from = (page - 1) * SAVED_PER_PAGE;
      const to = page * SAVED_PER_PAGE - 1;
      const { data, error, count } = await supabase
        .from("saved_events")
        .select("event_id, events(*)", { count: "exact" })
        .eq("user_id", userId)
        .order("saved_at", { ascending: false })
        .range(from, to);

      setTotalSavedCount(count ?? 0);

      if (!error && data) {
        const formatted: SavedEventItem[] = (
          data as unknown as Array<{
            event_id: string;
            events: DbEvent | DbEvent[];
          }>
        ).map((item, i) => ({
          // saved_events rows don't have an "id" in this select shape;
          // use event_id as a stable key (unique per user anyway)
          id: (item as unknown as { id?: string }).id ?? `${item.event_id}-${i}`,
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

  const handleViewEvent = (item: SavedEventItem) => {
    // events is already joined — no extra fetch needed
    if (item.events) {
      setSelectedEvent(mapDbRow(item.events));
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
        console.error("[Dashboard] Error fetching submissions:", error);
        setSubmissions([]);
      } else if (data) {
        console.log("[Dashboard] Fetched submissions for user", userId, data);
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
          .select("full_name, email, primary_city, avatar_url, role")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          setIsAdmin(true);
        }

        const name =
          profile?.full_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "User";
        setFullName(name);
        setNameInput(name);

        const rawAvatar =
          profile?.avatar_url ||
          currentUser.user_metadata?.avatar_id ||
          currentUser.user_metadata?.avatar_url ||
          "avatar-1";
        const normalizedAvatar =
          rawAvatar.replace(/^\/avatars\//, "").replace(/\.png$/, "") || "avatar-1";
        setSelectedAvatar(normalizedAvatar);

        if (profile?.email) {
          setEmail(profile.email);
        }

        if (profile?.primary_city) {
          setPrimaryCity(profile.primary_city);
        }

        // Fetch saved events (page 1)
        fetchSavedEvents(currentUser.id, 1);

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

  // Handle Unsave — delete then router.refresh() + re-fetch current page
  const handleUnsave = async (savedRowId: string) => {
    setUnsavingId(savedRowId);
    try {
      const { error } = await supabase
        .from("saved_events")
        .delete()
        .eq("id", savedRowId);
      if (!error && user?.id) {
        // Revalidate: if this was the last item on a non-first page, go back one
        const newTotal = (totalSavedCount ?? 1) - 1;
        const newMaxPage = Math.max(1, Math.ceil(newTotal / SAVED_PER_PAGE));
        const targetPage = Math.min(savedPage, newMaxPage);
        setSavedPage(targetPage);
        router.refresh();
        await fetchSavedEvents(user.id, targetPage);
      }
    } catch (err) {
      console.error("Error unsaving event:", err);
    } finally {
      setUnsavingId(null);
    }
  };

  // Handle City Change (3-Way Sync: State + Cookie + Profiles)
  const handleCityChange = async (newCity: string) => {
    setPrimaryCity(newCity);
    if (typeof document !== "undefined") {
      document.cookie = `selected_city=${encodeURIComponent(newCity)}; path=/; max-age=31536000; SameSite=Lax`;
    }
    setUserCity(newCity).catch((err) => {
      console.error("Failed to update primary city on server:", err);
    });
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

  // Handle Save Profile (Full Name & Avatar)
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!nameInput.trim()) {
      setProfileMessage({ type: "error", text: "Full name cannot be empty." });
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      // Update public.profiles table
      let { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: nameInput.trim(),
          avatar_url: selectedAvatar,
        })
        .eq("id", user.id);

      if (updateError) {
        // Fallback update
        const fallback = await supabase
          .from("profiles")
          .update({
            full_name: nameInput.trim(),
          })
          .eq("id", user.id);
        if (fallback.error) throw fallback.error;
      }

      // Keep Auth user_metadata synced
      await supabase.auth.updateUser({
        data: {
          full_name: nameInput.trim(),
          avatar_id: selectedAvatar,
          avatar_url: selectedAvatar,
        },
      });

      setFullName(nameInput.trim());
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => setProfileMessage(null), 4000);
      router.refresh();
    } catch (err: unknown) {
      console.error("Error saving profile:", err);
      const msg = err instanceof Error ? err.message : "Failed to save changes.";
      setProfileMessage({ type: "error", text: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordMessage(null);

    if (!newPassword) {
      setPasswordMessage({ type: "error", text: "Please enter a new password." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: unknown) {
      console.error("Error updating password:", err);
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err: unknown) {
      console.error("Error logging out:", err);
      setIsLoggingOut(false);
    }
  };

  // Format date like "Oct 5" strictly in PKT
  const formatDate = (dateStr?: string) => {
    return formatDatePKT(dateStr);
  };

  const initial = (fullName || email || "U").trim().charAt(0).toUpperCase();

  const savedTotalPages = Math.max(1, Math.ceil((totalSavedCount ?? 0) / SAVED_PER_PAGE));


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
                  {selectedAvatar ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                      <img
                        src={`/avatars/${selectedAvatar}.png`}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 text-lg sm:w-12 sm:h-12 sm:text-xl rounded-full bg-[#186BA7] flex items-center justify-center text-white font-medium flex-shrink-0">
                      {initial}
                    </div>
                  )}
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
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="flex-1 sm:flex-initial text-center px-2 py-2 sm:px-4 text-xs sm:text-sm rounded-none transition-colors duration-200 cursor-pointer border bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium"
                >
                  Admin Panel
                </button>
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
                    {totalSavedCount !== null && (
                      <span className="text-slate-500 font-normal text-xs sm:text-sm">
                        ({totalSavedCount})
                      </span>
                    )}
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
                  ) : totalSavedCount === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-3xl mb-3">🔖</div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        No saved events yet
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        Bookmark events you're interested in and they'll appear here.
                      </p>
                      <Link
                        href="/"
                        className="inline-block text-xs sm:text-sm font-semibold border border-[#186BA7] bg-[#186BA7] text-white px-4 py-2 rounded-sm hover:bg-[#155d91] transition-colors"
                      >
                        Browse Events
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
                                  <div
                                    onClick={() => handleViewEvent(item)}
                                    className="cursor-pointer hover:text-[#186BA7] transition-colors"
                                  >
                                    {eventTitle}
                                  </div>
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
                {!isLoadingEvents && (totalSavedCount ?? 0) > SAVED_PER_PAGE && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      disabled={savedPage === 1}
                      onClick={() => {
                        const p = savedPage - 1;
                        setSavedPage(p);
                        if (user?.id) fetchSavedEvents(user.id, p);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-sm border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      &#8249;
                    </button>
                    {Array.from({ length: savedTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setSavedPage(p);
                          if (user?.id) fetchSavedEvents(user.id, p);
                        }}
                        aria-current={savedPage === p ? "page" : undefined}
                        className={`w-8 h-8 flex items-center justify-center text-sm border rounded-sm transition-colors ${savedPage === p
                          ? "bg-[#186BA7] text-white border-[#186BA7] font-semibold"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={savedPage === savedTotalPages}
                      onClick={() => {
                        const p = savedPage + 1;
                        setSavedPage(p);
                        if (user?.id) fetchSavedEvents(user.id, p);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-sm border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      &#8250;
                    </button>
                  </div>
                )}
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
                  <SubmissionsTable
                    submissions={submissions}
                    isLoading={isLoadingSubmissions}
                  />
                </div>
              </section>
            )}

            {/* ── Settings Tab Content ─────────────────────────────────────── */}
            {activeTab === "Settings" && (
              <div className="space-y-8">
                {/* 1. Profile Information Card */}
                <section
                  aria-labelledby="profile-info-heading"
                  className="border border-slate-200 rounded-sm bg-white p-5 sm:p-8 shadow-xs"
                >
                  <h2
                    id="profile-info-heading"
                    className="text-sm sm:text-base font-bold text-slate-900 mb-6"
                  >
                    Profile Information
                  </h2>

                  {/* Avatars Section */}
                  <div className="mb-8">
                    {/* Mobile: "Default Avatars" heading above current avatar */}
                    <h3 className="block md:hidden text-xs sm:text-sm font-bold text-slate-900 mb-4">
                      Default Avatars
                    </h3>

                    <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                      {/* Current Avatar */}
                      <div className="flex flex-col items-center flex-shrink-0 mx-auto md:mx-0">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-xs">
                          <img
                            src={`/avatars/${selectedAvatar}.png`}
                            alt="Current avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-slate-500 mt-2 font-normal text-center">
                          Current avatar
                        </span>
                      </div>

                      {/* Default Avatars list/grid */}
                      <div className="flex-1 min-w-0">
                        {/* Desktop: "Default Avatars" heading */}
                        <h3 className="hidden md:block text-xs sm:text-sm font-bold text-slate-900 mb-3">
                          Default Avatars
                        </h3>

                        {/* Grid on mobile (3 cols), flex-wrap on desktop */}
                        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 max-w-[280px] sm:max-w-none mx-auto md:mx-0">
                          {DEFAULT_AVATARS.map((avatarId) => {
                            const isSelected = selectedAvatar === avatarId;
                            return (
                              <button
                                key={avatarId}
                                type="button"
                                onClick={() => setSelectedAvatar(avatarId)}
                                aria-label={`Select ${avatarId}`}
                                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full cursor-pointer transition-all duration-150 focus:outline-none p-0.5 ${isSelected
                                  ? "ring-2 ring-[#186BA7] ring-offset-2 scale-105"
                                  : "hover:scale-105 opacity-90 hover:opacity-100"
                                  }`}
                              >
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                                  <img
                                    src={`/avatars/${avatarId}.png`}
                                    alt={avatarId}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {isSelected && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#186BA7] text-white rounded-full flex items-center justify-center shadow-xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form: Full Name & Email */}
                  <form onSubmit={handleSaveProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm bg-white text-slate-900 focus:outline-none focus:border-[#186BA7] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          readOnly
                          disabled
                          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-sm bg-slate-50/80 text-slate-500 cursor-not-allowed select-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Email is read-only.
                        </p>
                      </div>
                    </div>

                    {profileMessage && (
                      <div
                        className={`mb-4 text-xs font-medium px-3.5 py-2 rounded-sm ${profileMessage.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                      >
                        {profileMessage.text}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        isLoading={isSavingProfile}
                        className="w-36 sm:w-44 whitespace-nowrap px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </section>

                {/* 2. Security Section */}
                <section
                  aria-labelledby="security-heading"
                  className="border border-slate-200 rounded-sm bg-white p-5 sm:p-8 shadow-xs"
                >
                  <h2
                    id="security-heading"
                    className="text-sm sm:text-base font-bold text-slate-900 mb-6"
                  >
                    Security
                  </h2>

                  <form onSubmit={handleUpdatePassword}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm bg-white text-slate-900 focus:outline-none focus:border-[#186BA7] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm bg-white text-slate-900 focus:outline-none focus:border-[#186BA7] transition-colors"
                        />
                      </div>
                    </div>

                    {passwordMessage && (
                      <div
                        className={`mb-4 text-xs font-medium px-3.5 py-2 rounded-sm ${passwordMessage.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                      >
                        {passwordMessage.text}
                      </div>
                    )}

                    <div className="flex justify-end gap-4 mt-4">
                      <Button
                        type="submit"
                        isLoading={isUpdatingPassword}
                        className="w-44 whitespace-nowrap px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm"
                      >
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        onClick={handleLogout}
                        isLoading={isLoggingOut}
                        className="w-44 whitespace-nowrap px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                        Logout
                      </Button>
                    </div>
                  </form>
                </section>
              </div>
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
          }}
        />
      )}



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
