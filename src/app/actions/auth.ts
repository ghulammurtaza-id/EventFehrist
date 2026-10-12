"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string | null;
  };
  redirectTo?: string;
}

/**
 * Robust, safe, and serializable Login Server Action.
 * Handles signInWithPassword, ban verification, and city preference sync.
 * ALWAYS returns a plain serializable JSON object — NEVER throws to the client.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    if (!email?.trim() || !password) {
      return {
        success: false,
        error: "Email and password are required.",
      };
    }

    const cookieStore = await cookies();
    const supabase = createServerActionClient({
      cookies: () => cookieStore as any,
    });

    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data?.user) {
      const msg = error?.message?.toLowerCase() || "";
      const isWrongCredentials =
        msg.includes("invalid") ||
        msg.includes("credential") ||
        msg.includes("grant");

      return {
        success: false,
        error: isWrongCredentials
          ? "Invalid email or password"
          : error?.message || "Login failed",
      };
    }

    const userId = data.user.id;
    const userEmail = data.user.email || null;

    // 2. Optimized Database Query: ONLY fetch 'is_banned' column for maximum speed
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .maybeSingle();

    // 3. Immediate Ban Verification & SignOut with no unnecessary delays
    if (profile?.is_banned === true) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Your account has been banned. Please contact support for more information.",
      };
    }

    // 4. Return clean serializable primitives
    return {
      success: true,
      user: {
        id: userId,
        email: userEmail,
      },
      redirectTo: "/",
    };
  } catch (err: any) {
    console.error("[loginUser] Unexpected error in login server action:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
