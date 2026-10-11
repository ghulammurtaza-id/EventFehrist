"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

export interface SetCityResult {
  success: boolean;
  city: string;
  authenticated: boolean;
  error?: string;
}

export interface SyncCityResult {
  success: boolean;
  syncedCity: string | null;
  source: "profile" | "cookie" | "none";
}

/**
 * Server action to update user city:
 * 1. Sets 'selected_city' cookie for future visits (works for both guests and authenticated users).
 * 2. If the user is logged in, updates their 'primary_city' in the public.profiles table.
 */
export async function setUserCity(city: string): Promise<SetCityResult> {
  if (!city || typeof city !== "string") {
    return { success: false, city: "", authenticated: false, error: "Invalid city name." };
  }

  const cookieStore = await cookies();

  // 1. Set the 'selected_city' cookie with 1-year expiration
  try {
    cookieStore.set("selected_city", city, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } catch (err) {
    console.error("Failed to set selected_city cookie in server action:", err);
  }

  // 2. If authenticated, update public.profiles table
  try {
    const supabase = createServerActionClient({
      cookies: () => cookieStore as any,
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          primary_city: city,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) {
        console.error("Error updating primary_city in profiles table:", error);
        return {
          success: false,
          city,
          authenticated: true,
          error: error.message,
        };
      }

      return { success: true, city, authenticated: true };
    }
  } catch (err) {
    console.error("Error checking session or updating profile in setUserCity server action:", err);
  }

  return { success: true, city, authenticated: false };
}

/**
 * Syncs city preference when a guest user logs in:
 * 1. Check if user has a 'selected_city' cookie.
 * 2. Fetch user's 'primary_city' from public.profiles table.
 * 3. Logic:
 *    - If DB primary_city is null/empty, update DB with value from selected_city cookie.
 *    - If DB primary_city already has a value, update selected_city cookie to match DB (overwriting guest preference).
 */
export async function syncUserCityOnLogin(userId?: string): Promise<SyncCityResult> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("selected_city")?.value;
  const cookieCity = rawCookie ? decodeURIComponent(rawCookie.trim()) : null;

  const supabase = createServerActionClient({
    cookies: () => cookieStore as any,
  });

  let targetUserId = userId;
  if (!targetUserId) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    targetUserId = session?.user?.id;
  }

  if (!targetUserId) {
    return { success: false, syncedCity: cookieCity, source: "cookie" };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_city")
      .eq("id", targetUserId)
      .maybeSingle();

    const dbCity = profile?.primary_city?.trim();

    // Condition 1: If DB primary_city is null/empty and guest has selected_city cookie, update DB
    if (!dbCity && cookieCity) {
      await supabase
        .from("profiles")
        .update({
          primary_city: cookieCity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      // Keep cookie aligned
      cookieStore.set("selected_city", cookieCity, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return { success: true, syncedCity: cookieCity, source: "cookie" };
    }

    // Condition 2: If DB primary_city already has a value, update cookie to match DB
    if (dbCity) {
      cookieStore.set("selected_city", dbCity, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return { success: true, syncedCity: dbCity, source: "profile" };
    }

    return { success: true, syncedCity: null, source: "none" };
  } catch (err) {
    console.error("Error in syncUserCityOnLogin server action:", err);
    return { success: false, syncedCity: cookieCity, source: "none" };
  }
}
