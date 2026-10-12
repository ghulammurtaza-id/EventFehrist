import type { Event, EventCategory, EventStatus } from "@/lib/mockData";
import type { Database } from "@/lib/supabaseClient";

// DB row type alias matching events table row in Supabase
export type DbEvent = Database["public"]["Tables"]["events"]["Row"];

/**
 * Maps a Supabase DB row to the domain Event type used by UI components.
 * Pure server-safe utility function (no browser APIs).
 */
export function mapDbRow(row: DbEvent): Event {
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
    is_verified: false,
    status: (row.status as EventStatus) || "Pending",
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
