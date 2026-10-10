import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Supabase redirects here after email verification with a one-time `code`
 * query parameter.  We exchange it for a session (which is written to the
 * user's cookies by the auth-helpers client) and then send them on to the
 * success page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error("Auth callback error exchanging code for session:", error);
    }
  }

  // Always redirect — even if code was missing or already used — so the user never gets stuck.
  return NextResponse.redirect(new URL("/verify-success", origin));
}
