"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Security Check:
 * Validates the caller's session and verifies that role === 'admin'
 * in public.profiles. Must be called at the start of every admin action.
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
    throw new Error("Unauthorized: You must be logged in to perform admin moderation.");
  }

  // Security check: Verify admin role from profiles table
  const { data: profile, error: profileError } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const userProfile = profile as { role?: string | null } | null;

  if (profileError || userProfile?.role !== "admin") {
    throw new Error("Forbidden: You do not have admin permissions to perform this action.");
  }

  return session.user;
}

/**
 * Resolves the Supabase client for admin operations:
 * 1) If SUPABASE_SERVICE_ROLE_KEY is configured in .env.local, returns a service_role client (bypasses RLS).
 * 2) Otherwise falls back to sessionClient (which works if the user added the Admin RLS policy in Supabase).
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
 * Approves an event: sets status = 'Approved' and clears review_notes to null.
 */
export async function approveEvent(eventId: string): Promise<AdminActionResult> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required." };
    }

    console.log(`[Admin Action: approveEvent] Starting for eventId: "${eventId}"`);
    const supabase = await getAdminClient();

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "Approved",
        review_notes: null,
      } as any)
      .eq("id", eventId)
      .select("id, status, review_notes");

    console.log(`[Admin Action: approveEvent] Supabase result:`, { data, error });

    if (error) {
      console.error(`[Admin Action: approveEvent] Database error:`, error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error:
          "Database update failed: 0 rows modified. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or add the Admin RLS policy in your Supabase SQL editor.",
      };
    }

    console.log(`[Admin Action: approveEvent] Successfully updated event ${eventId} to "Approved"`);

    revalidatePath("/admin");
    revalidatePath("/my-submissions");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, data: data[0] };
  } catch (err: unknown) {
    console.error("[Admin Action: approveEvent] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to approve event.";
    return { success: false, error: msg };
  }
}

/**
 * Requests revision for an event: sets status = 'Needs Revision' and stores notes in review_notes.
 * Uses supabaseAdmin to bypass RLS after verifying admin permissions.
 */
export async function requestRevision(
  eventId: string,
  notes: string
): Promise<AdminActionResult> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required." };
    }

    const trimmedNotes = (notes || "").trim();
    if (!trimmedNotes) {
      return { success: false, error: "Please provide feedback notes explaining what needs to be fixed." };
    }

    console.log(
      `[Admin Action: requestRevision] Starting for eventId: "${eventId}", new status: "Needs Revision", review_notes: "${trimmedNotes}"`
    );

    const supabase = await getAdminClient();

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "Needs Revision",
        review_notes: trimmedNotes,
      } as any)
      .eq("id", eventId)
      .select("id, status, review_notes");

    console.log(`[Admin Action: requestRevision] Supabase result:`, { data, error });

    if (error) {
      console.error(`[Admin Action: requestRevision] Database error:`, error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error:
          "Database update failed: 0 rows modified. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or add the Admin RLS policy in your Supabase SQL editor.",
      };
    }

    console.log(
      `[Admin Action: requestRevision] Successfully updated event ${eventId} in database:`,
      data[0]
    );

    revalidatePath("/admin");
    revalidatePath("/my-submissions");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, data: data[0] };
  } catch (err: unknown) {
    console.error("[Admin Action: requestRevision] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to request revision.";
    return { success: false, error: msg };
  }
}

/**
 * Rejects an event: sets status = 'Rejected' and saves optional notes to review_notes.
 */
export async function rejectEvent(
  eventId: string,
  notes?: string
): Promise<AdminActionResult> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required." };
    }

    const trimmedNotes = (notes || "").trim() || null;

    console.log(
      `[Admin Action: rejectEvent] Starting for eventId: "${eventId}", new status: "Rejected", review_notes: "${trimmedNotes}"`
    );

    const supabase = await getAdminClient();

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "Rejected",
        review_notes: trimmedNotes,
      } as any)
      .eq("id", eventId)
      .select("id, status, review_notes");

    console.log(`[Admin Action: rejectEvent] Supabase result:`, { data, error });

    if (error) {
      console.error(`[Admin Action: rejectEvent] Database error:`, error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error:
          "Database update failed: 0 rows modified. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or add the Admin RLS policy in your Supabase SQL editor.",
      };
    }

    console.log(`[Admin Action: rejectEvent] Successfully updated event ${eventId} to "Rejected"`);

    revalidatePath("/admin");
    revalidatePath("/my-submissions");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, data: data[0] };
  } catch (err: unknown) {
    console.error("[Admin Action: rejectEvent] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to reject event.";
    return { success: false, error: msg };
  }
}
