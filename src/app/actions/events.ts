"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

export interface EventSubmissionInput {
  id?: string;
  isEdit?: boolean;
  title: string;
  organizer_name: string;
  category: string;
  event_type: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  reg_opens?: string | null;
  reg_deadline?: string | null;
  city: string;
  location_details?: string | null;
  description: string;
  registration_url?: string | null;
  website?: string | null;
  fee?: string | null;
  audience?: string[];
  level?: string[];
  highlights?: string[];
}

export interface EventSubmissionResult {
  success: boolean;
  eventId?: string;
  error?: string;
  sessionExpired?: boolean;
  fieldErrors?: Record<string, string>;
}

const VALID_CATEGORIES = new Set([
  "Technology",
  "Business",
  "Arts & Culture",
  "Sports",
  "Education",
  "Health & Wellness",
  "Gaming",
  "Community",
  "Food & Lifestyle",
]);

const VALID_EVENT_TYPES = new Set([
  "Conference",
  "Workshop",
  "Hackathon",
  "Meetup",
  "Competition",
  "Exhibition",
  "Seminar",
]);

/**
 * Server Action: Submit or update an event listing.
 * Strict validation is executed BEFORE any database mutation.
 * If validation fails, NO record is inserted or updated (prevents ghost/corrupted records).
 */
export async function submitEventAction(
  input: EventSubmissionInput
): Promise<EventSubmissionResult> {
  const cookieStore = await cookies();
  const supabase = createServerActionClient({
    cookies: () => cookieStore as any,
  });

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Your session has expired. Please sign in to save your event listing.",
      sessionExpired: true,
    };
  }

  // 2. Strict Server-Side Validation (Zero Ghost Records)
  const fieldErrors: Record<string, string> = {};

  const title = input.title?.trim() || "";
  if (!title || title.length < 3) {
    fieldErrors.title = "Event title must be at least 3 characters.";
  } else if (title.length > 200) {
    fieldErrors.title = "Event title cannot exceed 200 characters.";
  }

  const organizerName = input.organizer_name?.trim() || "";
  if (!organizerName) {
    fieldErrors.organizer_name = "Organizer name is required.";
  } else if (organizerName.length > 100) {
    fieldErrors.organizer_name = "Organizer name cannot exceed 100 characters.";
  }

  if (!input.category || !VALID_CATEGORIES.has(input.category.trim())) {
    fieldErrors.category = "Please select a valid category from the list.";
  }

  if (!input.event_type || !VALID_EVENT_TYPES.has(input.event_type.trim())) {
    fieldErrors.event_type = "Please select a valid event format / type.";
  }

  const eventDate = input.event_date?.trim() || "";
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    fieldErrors.event_date = "Please enter a valid event date (YYYY-MM-DD).";
  } else {
    const parsedDate = new Date(`${eventDate}T00:00:00Z`);
    if (isNaN(parsedDate.getTime())) {
      fieldErrors.event_date = "Invalid calendar date provided.";
    }
  }

  const city = input.city?.trim() || "";
  if (!city || city === "Select a city" || city === "All Cities") {
    fieldErrors.city = "Please select a valid city in Pakistan.";
  }

  const description = input.description?.trim() || "";
  if (!description) {
    fieldErrors.description = "Event description is required.";
  } else if (description.length < 10) {
    fieldErrors.description = "Description must be at least 10 characters.";
  } else if (description.length > 1500) {
    fieldErrors.description = "Description cannot exceed 1500 characters.";
  }

  // Optional URL validations
  const regUrl = input.registration_url?.trim() || null;
  if (regUrl && !/^https?:\/\/.+/i.test(regUrl)) {
    fieldErrors.registration_url = "Registration link must be a valid URL starting with http:// or https://";
  }

  const websiteUrl = input.website?.trim() || null;
  if (websiteUrl && !/^https?:\/\/.+/i.test(websiteUrl)) {
    fieldErrors.website = "Website link must be a valid URL starting with http:// or https://";
  }

  // If ANY validation check failed, STOP HERE. Do not insert anything.
  if (Object.keys(fieldErrors).length > 0) {
    const firstErrorMessage = Object.values(fieldErrors)[0];
    return {
      success: false,
      error: firstErrorMessage,
      fieldErrors,
    };
  }

  // 3. Prepare Clean Database Record
  const audienceArray =
    input.audience && input.audience.length > 0 ? input.audience : ["Open to All"];
  const levelArray =
    input.level && input.level.length > 0 ? input.level : ["All Levels"];
  const highlightsArray = input.highlights || [];

  const recordPayload = {
    event_name: title,
    organizer_name: organizerName,
    category: input.category.trim(),
    event_type: input.event_type.trim(),
    event_date: eventDate,
    start_time: input.start_time?.trim() || null,
    end_time: input.end_time?.trim() || null,
    registration_opens: input.reg_opens?.trim() || null,
    registration_deadline: input.reg_deadline?.trim() || null,
    city,
    venue_location: input.location_details?.trim() || city || "Venue TBD",
    description,
    registration_url: regUrl,
    website_social: websiteUrl,
    fee: input.fee?.trim() || "Free",
    status: "Pending", // Always Pending on new submit or edit for moderation
    audience: audienceArray,
    level: levelArray,
    highlights: highlightsArray,
  };

  try {
    if (input.isEdit && input.id) {
      // Edit Mode: Update existing record, ensuring caller is the organizer
      const { error: updateError } = await supabase
        .from("events")
        .update({
          ...recordPayload,
          review_notes: null, // Clear past revision feedback
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("organizer_id", user.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        return {
          success: false,
          error: updateError.message || "Failed to update event listing.",
        };
      }

      return { success: true, eventId: input.id };
    } else {
      // Create Mode: Insert new record
      const { data: inserted, error: insertError } = await supabase
        .from("events")
        .insert([
          {
            ...recordPayload,
            organizer_id: user.id,
            created_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        return {
          success: false,
          error: insertError.message || "Failed to save event listing.",
        };
      }

      return { success: true, eventId: inserted?.id };
    }
  } catch (err: any) {
    console.error("Unexpected error saving event listing:", err);
    return {
      success: false,
      error: err?.message || "An unexpected server error occurred.",
    };
  }
}
