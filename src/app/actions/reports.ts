"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export interface ActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Validates caller's session and verifies that role === 'admin'
 * in public.profiles. Must be called at start of admin operations.
 */
async function verifyAdminCaller() {
  const cookieStore = await cookies();
  const sessionClient = createServerActionClient({
    cookies: () => cookieStore as any,
  });

  const {
    data: { session },
    error: sessionError,
  } = await sessionClient.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }

  const { data: profile, error: profileError } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const userProfile = profile as { role?: string | null } | null;

  if (profileError || userProfile?.role !== "admin") {
    throw new Error("Forbidden: Admin privileges required.");
  }

  return session.user;
}

/**
 * Resolves the Supabase client for admin operations.
 * Uses service role key if available, otherwise session client.
 */
async function getAdminClient() {
  await verifyAdminCaller();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && serviceRoleKey.trim() && supabaseUrl) {
    return createClient(supabaseUrl, serviceRoleKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  const cookieStore = await cookies();
  return createServerActionClient({
    cookies: () => cookieStore as any,
  });
}

/**
 * Phase 1: User-Side Reporting Action
 * Authenticated users can report an event with a reason.
 */
export async function submitReport(
  eventId: string,
  reason: string,
  description?: string
): Promise<ActionResult> {
  try {
    if (!eventId || !reason?.trim()) {
      return { success: false, error: "Event ID and reason are required." };
    }

    if (description && description.length > 500) {
      return { success: false, error: "Description must be 500 characters or less." };
    }

    const cookieStore = await cookies();
    const sessionClient = createServerActionClient({
      cookies: () => cookieStore as any,
    });

    const {
      data: { session },
      error: sessionError,
    } = await sessionClient.auth.getSession();

    if (sessionError || !session?.user) {
      return { success: false, error: "You must be logged in to report an event." };
    }

    // Verify user is not banned
    const { data: profile } = await sessionClient
      .from("profiles")
      .select("is_banned")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile?.is_banned === true) {
      return { success: false, error: "Your account has been banned." };
    }

    const { error: insertError } = await sessionClient.from("reports").insert({
      reporter_id: session.user.id,
      event_id: eventId,
      reason: reason.trim(),
      description: description?.trim() || null,
      status: "Pending",
    });

    if (insertError) {
      console.error("[submitReport] Insert error:", insertError);
      return { success: false, error: insertError.message || "Failed to submit report." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[submitReport] Unexpected error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred." };
  }
}

/**
 * Phase 2: Admin Panel - Toggle User Ban
 * Admin can set is_banned on a user profile.
 */
export async function toggleUserBan(
  userId: string,
  isBanned: boolean
): Promise<ActionResult> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    const adminClient = await getAdminClient();

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ is_banned: isBanned })
      .eq("id", userId);

    if (updateError) {
      console.error("[toggleUserBan] Update error:", updateError);
      return { success: false, error: updateError.message || "Failed to update user ban status." };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("[toggleUserBan] Error:", err);
    return { success: false, error: err?.message || "Failed to toggle user ban status." };
  }
}

/**
 * Phase 2: Admin Panel - Resolve Report
 * Actions:
 * - 'hide_event': updates event status to 'Rejected' (hidden) and sets report status to 'Resolved'
 * - 'dismiss': sets report status to 'Resolved'
 */
export async function resolveReport(
  reportId: string,
  action: "hide_event" | "dismiss"
): Promise<ActionResult> {
  try {
    if (!reportId) {
      return { success: false, error: "Report ID is required." };
    }

    const adminClient = await getAdminClient();

    if (action === "hide_event") {
      // 1. Fetch the event_id from the report
      const { data: reportData, error: reportFetchError } = await adminClient
        .from("reports")
        .select("event_id")
        .eq("id", reportId)
        .maybeSingle();

      if (reportFetchError || !reportData) {
        return { success: false, error: "Report not found." };
      }

      // 2. Hide event by setting status to 'Rejected'
      const { error: eventError } = await adminClient
        .from("events")
        .update({
          status: "Rejected",
          review_notes: "Listing hidden following community report review.",
        })
        .eq("id", reportData.event_id);

      if (eventError) {
        console.error("[resolveReport] Event status update error:", eventError);
        return { success: false, error: "Failed to update event status." };
      }
    }

    // Mark report as 'Resolved'
    const { error: reportUpdateError } = await adminClient
      .from("reports")
      .update({ status: "Resolved" })
      .eq("id", reportId);

    if (reportUpdateError) {
      console.error("[resolveReport] Report resolution error:", reportUpdateError);
      return { success: false, error: "Failed to resolve report." };
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("[resolveReport] Error:", err);
    return { success: false, error: err?.message || "Failed to resolve report." };
  }
}
