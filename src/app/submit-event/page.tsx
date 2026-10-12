"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import CityCombobox from "@/components/CityCombobox";

const CATEGORIES = [
  "Technology",
  "Business",
  "Arts & Culture",
  "Sports",
  "Education",
  "Health & Wellness",
  "Gaming",
  "Community",
  "Food & Lifestyle",
];

const EVENT_TYPES = [
  "Conference",
  "Workshop",
  "Hackathon",
  "Meetup",
  "Competition",
  "Exhibition",
  "Seminar",
  "Festival",
  "Webinar",
];

const AUDIENCE_OPTIONS = [
  "Open to All",
  "Students",
  "Professionals",
] as const;

const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "All Levels",
] as const;

const HIGHLIGHTS_OPTIONS = [
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
    <label className="flex items-center gap-2 cursor-pointer group select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div
        className={`w-3.5 h-3.5 rounded-[2px] flex items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-slate-800 peer-focus-visible:ring-offset-1 shrink-0 ${
          checked
            ? "bg-slate-800 border-slate-800 text-white"
            : "border-slate-300 bg-white"
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
      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400";

function SubmitEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support both `id` and legacy `edit` query param
  const eventId = searchParams.get("id") || searchParams.get("edit");
  const mode = searchParams.get("mode") || (searchParams.has("edit") ? "edit" : "");
  const isEditMode = mode === "edit" && Boolean(eventId);

  const [form, setForm] = useState({
    title: "",
    organizer_name: "",
    category: "Technology",
    event_type: "Hackathon",
    event_date: "",
    start_time: "",
    end_time: "",
    reg_opens: "",
    reg_deadline: "",
    city: "Karachi",
    location_details: "",
    description: "",
    registration_url: "",
    website: "",
    fee: "",
  });

  const [audience, setAudience] = useState<string[]>([]);
  const [level, setLevel] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEvent, setIsFetchingEvent] = useState(isEditMode);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDescTooLong = form.description.length > 1500;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize description textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [form.description]);

  // If in edit mode, fetch existing event data from Supabase and prefill form
  useEffect(() => {
    async function loadEventData() {
      if (!isEditMode || !eventId) return;

      setIsFetchingEvent(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push(`/login?redirect=/submit-event?id=${eventId}&mode=edit`);
          return;
        }

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (error || !data) {
          setErrorMessage("Event not found or failed to load event details.");
          return;
        }

        // Security check: verify that the organizer_id of the event matches current user
        if (data.organizer_id && data.organizer_id !== user.id) {
          setErrorMessage("Unauthorized: You can only edit events that you submitted.");
          setIsUnauthorized(true);
          return;
        }

        // Rejected events cannot be edited
        if (data.status === "Rejected" || (data.status && data.status.toLowerCase() === "rejected")) {
          setErrorMessage("This event has been rejected and cannot be edited or resubmitted.");
          setIsUnauthorized(true);
          return;
        }

        // Pre-fill form state with fetched event data
        setForm({
          title: data.event_name || "",
          organizer_name: data.organizer_name || "",
          category: data.category || "Technology",
          event_type: data.event_type || "Hackathon",
          event_date: data.event_date || "",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          reg_opens: data.registration_opens || "",
          reg_deadline: data.registration_deadline || "",
          city: data.city || "Karachi",
          location_details: data.venue_location || "",
          description: data.description || "",
          registration_url: data.registration_url || "",
          website: data.website_social || "",
          fee: data.fee || "",
        });

        if (data.audience && Array.isArray(data.audience)) {
          setAudience(data.audience);
        }
        if (data.level && Array.isArray(data.level)) {
          setLevel(data.level);
        }
        if (data.highlights && Array.isArray(data.highlights)) {
          setHighlights(data.highlights);
        }
      } catch (err) {
        console.error("Error loading event for edit:", err);
        setErrorMessage("An unexpected error occurred while loading the event data.");
      } finally {
        setIsFetchingEvent(false);
      }
    }

    loadEventData();
  }, [isEditMode, eventId, router]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleAudience = (val: string) => {
    setAudience((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const toggleLevel = (val: string) => {
    setLevel((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const toggleHighlights = (val: string) => {
    setHighlights((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const trimmedDesc = form.description.trim();
    if (!trimmedDesc) {
      setErrorMessage("Please enter an event description.");
      setIsLoading(false);
      return;
    }

    if (form.description.length > 1500) {
      setErrorMessage("Description cannot exceed 1500 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("You must be logged in to submit or update an event. Please sign in and try again.");
        setIsLoading(false);
        return;
      }

      // Security check in edit mode
      if (isEditMode && isUnauthorized) {
        setErrorMessage("Unauthorized: You can only edit events that you submitted.");
        setIsLoading(false);
        return;
      }

      const audienceArray = audience.length > 0 ? audience : ["Open to All"];
      const levelArray = level.length > 0 ? level : ["All Levels"];
      const highlightsArray = highlights;

      if (isEditMode && eventId) {
        // Mode === 'edit': UPDATE query with organizer_id security check
        const { error } = await supabase
          .from("events")
          .update({
            event_name: form.title,
            organizer_name: form.organizer_name,
            category: form.category,
            event_type: form.event_type,
            event_date: form.event_date,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            registration_opens: form.reg_opens || null,
            registration_deadline: form.reg_deadline || null,
            city: form.city,
            venue_location: form.location_details || form.city || "Venue TBD",
            description: form.description,
            registration_url: form.registration_url || null,
            website_social: form.website || null,
            fee: form.fee || "Free",
            status: "Pending", // Resubmit for review
            review_notes: null, // Clear old reviewer feedback on resubmission
            audience: audienceArray,
            level: levelArray,
            highlights: highlightsArray.length > 0 ? highlightsArray : [],
          })
          .eq("id", eventId)
          .eq("organizer_id", user.id); // Security check

        if (error) {
          setErrorMessage(error.message || "Failed to update event.");
          setIsLoading(false);
          return;
        }

        setIsSubmitted(true);
      } else {
        // Mode !== 'edit': INSERT query
        const { error } = await supabase.from("events").insert([
          {
            organizer_id: user.id,
            event_name: form.title,
            organizer_name: form.organizer_name,
            category: form.category,
            event_type: form.event_type,
            event_date: form.event_date,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            registration_opens: form.reg_opens || null,
            registration_deadline: form.reg_deadline || null,
            city: form.city,
            venue_location: form.location_details || form.city || "Venue TBD",
            description: form.description,
            registration_url: form.registration_url || null,
            website_social: form.website || null,
            fee: form.fee || "Free",
            status: "Pending",
            audience: audienceArray,
            level: levelArray,
            highlights: highlightsArray.length > 0 ? highlightsArray : [],
          },
        ]);

        if (error) {
          setErrorMessage(error.message || "Failed to submit event.");
          setIsLoading(false);
          return;
        }

        setIsSubmitted(true);
      }
    } catch {
      setErrorMessage("An unexpected error occurred while saving the event.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
          <div className="border border-slate-200 p-8">
            <div className="w-10 h-10 flex items-center justify-center border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-lg mb-4">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Event Updated Successfully
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Your event changes have been saved and resubmitted to our moderation team for review.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard?tab=submissions"
                className="px-5 py-2 text-sm font-semibold border border-[#186BA7] bg-[#186BA7] text-white hover:bg-[#155d91] transition-all rounded-none"
              >
                Go to My Submissions
              </Link>
              <Link
                href="/"
                className="px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 transition-all rounded-none"
              >
                Return to Directory
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Page header */}
        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
          FOR ORGANIZERS
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {isEditMode ? "Edit Event" : "Submit an event"}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {isEditMode
            ? "Update the details of your event below. Changes will be resubmitted for moderation review."
            : "Use a clear event name, working registration URL and accurate deadline. Reviews usually take one business day."}
        </p>

        {isFetchingEvent ? (
          <div className="border border-slate-200 p-12 text-center text-sm text-slate-500 bg-slate-50/50">
            Loading event details for editing...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ── Event Information Card ─────────────────────────────────── */}
            <div className="border border-slate-200 mb-6 rounded-t-xl">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  {isEditMode ? "Edit Event Information" : "Event information"}
                </span>
                {isEditMode && (
                  <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 font-medium rounded-xs">
                    Edit Mode
                  </span>
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Row 1 — Event Name | Organizer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-xs font-bold text-slate-900 mb-1">
                      Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      value={form.title}
                      onChange={set("title")}
                      placeholder="Enter event name"
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                  <div>
                    <label htmlFor="organizer_name" className="block text-xs font-bold text-slate-900 mb-1">
                      Organizer <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="organizer_name"
                      name="organizer_name"
                      type="text"
                      required
                      value={form.organizer_name}
                      onChange={set("organizer_name")}
                      placeholder="Enter organizer name"
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                </div>

                {/* Row 2 — Category | Event Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-xs font-bold text-slate-900 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={set("category")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="event_type" className="block text-xs font-bold text-slate-900 mb-1">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="event_type"
                      name="event_type"
                      value={form.event_type}
                      onChange={set("event_type")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3 — Event Date | Start Time | End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="event_date" className="block text-xs font-bold text-slate-900 mb-1">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="event_date"
                      name="event_date"
                      type="date"
                      required
                      value={form.event_date}
                      onChange={set("event_date")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                  <div>
                    <label htmlFor="start_time" className="block text-xs font-bold text-slate-900 mb-1">
                      Start Time
                    </label>
                    <input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={form.start_time}
                      onChange={set("start_time")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                  <div>
                    <label htmlFor="end_time" className="block text-xs font-bold text-slate-900 mb-1">
                      End Time
                    </label>
                    <input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={form.end_time}
                      onChange={set("end_time")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                </div>

                {/* Row 4 — Registration Opens | Registration Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg_opens" className="block text-xs font-bold text-slate-900 mb-1">
                      Registration Opens
                    </label>
                    <input
                      id="reg_opens"
                      name="reg_opens"
                      type="date"
                      value={form.reg_opens}
                      onChange={set("reg_opens")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg_deadline" className="block text-xs font-bold text-slate-900 mb-1">
                      Registration Deadline
                    </label>
                    <input
                      id="reg_deadline"
                      name="reg_deadline"
                      type="date"
                      value={form.reg_deadline}
                      onChange={set("reg_deadline")}
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                </div>

                {/* Row 5 — City | Venue / Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative z-30">
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <CityCombobox
                      value={form.city}
                      onChange={(city) => setForm((prev) => ({ ...prev, city }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="location_details" className="block text-xs font-bold text-slate-900 mb-1">
                      Venue / Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="location_details"
                      name="location_details"
                      type="text"
                      required
                      value={form.location_details}
                      onChange={set("location_details")}
                      placeholder="Enter venue or online link"
                      className={`${inputCls} h-10`}
                      disabled={isUnauthorized}
                    />
                  </div>
                </div>

                {/* Row 6 — Description */}
                <div>
                  <label htmlFor="description" className="block text-xs font-bold text-slate-900 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    ref={textareaRef}
                    required
                    value={form.description}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, description: e.target.value }));
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    placeholder="Describe the event, agenda, and what attendees can expect..."
                    className="w-full min-h-[100px] p-4 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#186BA7]/20 focus:border-[#186BA7] transition-all resize-none overflow-hidden"
                    disabled={isUnauthorized}
                  />

                  {/* Character Counter */}
                  <div
                    className={`text-xs mt-1 text-right ${
                      isDescTooLong ? "text-red-500 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {form.description.length} / 1500 characters
                  </div>
                </div>

                {/* Row 7 — Registration URL | Website / Social */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="registration_url" className="block text-xs font-bold text-slate-900 mb-1">
                      Registration URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="registration_url"
                      name="registration_url"
                      type="url"
                      required
                      value={form.registration_url}
                      onChange={set("registration_url")}
                      placeholder="https://"
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-xs font-bold text-slate-900 mb-1">
                      Website / Social
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={form.website}
                      onChange={set("website")}
                      placeholder="https://"
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                </div>

                {/* Row 8 — Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fee" className="block text-xs font-bold text-slate-900 mb-1">
                      Fee <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fee"
                      name="fee"
                      type="text"
                      required
                      value={form.fee}
                      onChange={set("fee")}
                      placeholder="Free or Rs. amount"
                      className={inputCls}
                      disabled={isUnauthorized}
                    />
                  </div>
                </div>

                {/* Event Attributes (Optional) */}
                <div className="pt-5 border-t border-slate-200">
                  <h3 className="font-bold text-slate-900">
                    Event Attributes (Optional)
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Help users find your event by adding tags.
                  </p>

                  <div className="space-y-4">
                    {/* Audience */}
                    <div>
                      <span className="block text-xs font-bold text-slate-900 mb-2">
                        Audience
                      </span>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {AUDIENCE_OPTIONS.map((opt) => (
                          <CheckboxItem
                            key={opt}
                            label={opt}
                            checked={audience.includes(opt)}
                            onChange={() => toggleAudience(opt)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Level */}
                    <div>
                      <span className="block text-xs font-bold text-slate-900 mb-2">
                        Level
                      </span>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {LEVEL_OPTIONS.map((opt) => (
                          <CheckboxItem
                            key={opt}
                            label={opt}
                            checked={level.includes(opt)}
                            onChange={() => toggleLevel(opt)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <span className="block text-xs font-bold text-slate-900 mb-2">
                        Highlights
                      </span>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {HIGHLIGHTS_OPTIONS.map((opt) => (
                          <CheckboxItem
                            key={opt}
                            label={opt}
                            checked={highlights.includes(opt)}
                            onChange={() => toggleHighlights(opt)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 mb-4 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-sm" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Submit / Update Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading || isDescTooLong || isFetchingEvent || isUnauthorized}
                className={`px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer ${
                  isLoading || isDescTooLong || isFetchingEvent || isUnauthorized
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading
                  ? isEditMode
                    ? "Updating..."
                    : "Submitting..."
                  : isEditMode
                  ? "Update Event"
                  : "Submit Event"}
              </button>

              {isEditMode && (
                <Link
                  href="/dashboard?tab=submissions"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </Link>
              )}
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SubmitEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white text-slate-900">
          <Navbar />
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
            <div className="p-12 text-center text-sm text-slate-500">
              Loading form...
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <SubmitEventForm />
    </Suspense>
  );
}
