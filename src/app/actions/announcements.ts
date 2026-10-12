"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export interface Announcement {
  id: string;
  text_content: string;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateAnnouncementInput {
  text_content: string;
  link_url?: string | null;
  link_text?: string | null;
  is_active?: boolean;
}

export interface UpdateAnnouncementInput {
  text_content?: string;
  link_url?: string | null;
  link_text?: string | null;
  is_active?: boolean;
}

export interface AnnouncementActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Security Check:
 * Validates the caller's session and verifies that role === 'admin' in public.profiles.
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
    throw new Error("Unauthorized: You must be logged in to perform admin operations.");
  }

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
 * Returns an admin Supabase client:
 * Uses SUPABASE_SERVICE_ROLE_KEY if set, otherwise falls back to authenticated sessionClient.
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
 * Fetch all announcements (both active and inactive) ordered by creation date descending.
 */
export async function getAnnouncements(): Promise<AnnouncementActionResult<Announcement[]>> {
  try {
    const supabase = await getAdminClient();

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Announcements Action: getAnnouncements] DB Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as Announcement[]) || [] };
  } catch (err: unknown) {
    console.error("[Announcements Action: getAnnouncements] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to fetch announcements.";
    return { success: false, error: msg };
  }
}

/**
 * Create a new announcement.
 * CRITICAL LOGIC: If is_active is true, first deactivates ALL existing announcements
 * to ensure only one announcement is active and prevent unique constraint violations.
 */
export async function createAnnouncement(
  data: CreateAnnouncementInput
): Promise<AnnouncementActionResult<Announcement>> {
  try {
    const text = data.text_content ? data.text_content.trim() : "";
    if (!text) {
      return { success: false, error: "Announcement text content is required." };
    }

    const isActive = Boolean(data.is_active);
    const linkUrl = data.link_url && data.link_url.trim() ? data.link_url.trim() : null;
    const linkText = linkUrl ? (data.link_text?.trim() || "Details") : (data.link_text?.trim() || null);

    const supabase = await getAdminClient();

    // If activating this announcement, deactivate all existing announcements first
    if (isActive) {
      const { error: deactivateError } = await supabase
        .from("announcements")
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deactivateError) {
        console.error("[Announcements Action: createAnnouncement] Deactivation Error:", deactivateError);
        return { success: false, error: `Failed to deactivate prior announcements: ${deactivateError.message}` };
      }
    }

    const { data: newRow, error: insertError } = await supabase
      .from("announcements")
      .insert({
        text_content: text,
        link_url: linkUrl,
        link_text: linkText,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      } as any)
      .select("*")
      .single();

    if (insertError) {
      console.error("[Announcements Action: createAnnouncement] Insert Error:", insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/");

    return { success: true, data: newRow as Announcement };
  } catch (err: unknown) {
    console.error("[Announcements Action: createAnnouncement] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to create announcement.";
    return { success: false, error: msg };
  }
}

/**
 * Update an announcement.
 * CRITICAL LOGIC: If is_active is set to true, first deactivates ALL other announcements.
 */
export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementInput
): Promise<AnnouncementActionResult<Announcement>> {
  try {
    if (!id) {
      return { success: false, error: "Announcement ID is required." };
    }

    const supabase = await getAdminClient();

    // If setting to active, deactivate all other announcements first
    if (data.is_active === true) {
      const { error: deactivateError } = await supabase
        .from("announcements")
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .neq("id", id);

      if (deactivateError) {
        console.error("[Announcements Action: updateAnnouncement] Deactivation Error:", deactivateError);
        return { success: false, error: `Failed to deactivate prior announcements: ${deactivateError.message}` };
      }
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.text_content !== undefined) {
      const text = data.text_content.trim();
      if (!text) {
        return { success: false, error: "Announcement text content cannot be empty." };
      }
      updates.text_content = text;
    }

    if (data.link_url !== undefined) {
      updates.link_url = data.link_url && data.link_url.trim() ? data.link_url.trim() : null;
    }

    if (data.link_text !== undefined) {
      updates.link_text = data.link_text && data.link_text.trim() ? data.link_text.trim() : "Details";
    }

    if (data.is_active !== undefined) {
      updates.is_active = Boolean(data.is_active);
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("announcements")
      .update(updates as any)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[Announcements Action: updateAnnouncement] Update Error:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/");

    return { success: true, data: updatedRow as Announcement };
  } catch (err: unknown) {
    console.error("[Announcements Action: updateAnnouncement] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to update announcement.";
    return { success: false, error: msg };
  }
}

/**
 * Delete an announcement.
 */
export async function deleteAnnouncement(id: string): Promise<AnnouncementActionResult> {
  try {
    if (!id) {
      return { success: false, error: "Announcement ID is required." };
    }

    const supabase = await getAdminClient();

    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Announcements Action: deleteAnnouncement] Delete Error:", deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    console.error("[Announcements Action: deleteAnnouncement] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to delete announcement.";
    return { success: false, error: msg };
  }
}

/**
 * Toggle announcement active status.
 * If isActive is true, deactivates all others first.
 */
export async function toggleAnnouncementStatus(
  id: string,
  isActive: boolean
): Promise<AnnouncementActionResult<Announcement>> {
  try {
    if (!id) {
      return { success: false, error: "Announcement ID is required." };
    }

    const supabase = await getAdminClient();

    // If toggling to active, deactivate all other announcements first
    if (isActive) {
      const { error: deactivateError } = await supabase
        .from("announcements")
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .neq("id", id);

      if (deactivateError) {
        console.error("[Announcements Action: toggleAnnouncementStatus] Deactivation Error:", deactivateError);
        return { success: false, error: `Failed to deactivate prior announcements: ${deactivateError.message}` };
      }
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("announcements")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[Announcements Action: toggleAnnouncementStatus] Toggle Error:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/");

    return { success: true, data: updatedRow as Announcement };
  } catch (err: unknown) {
    console.error("[Announcements Action: toggleAnnouncementStatus] Exception:", err);
    const msg = err instanceof Error ? err.message : "Failed to toggle announcement status.";
    return { success: false, error: msg };
  }
}
