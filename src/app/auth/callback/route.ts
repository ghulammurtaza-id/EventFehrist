import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Handles OAuth (e.g. Google) and auth callbacks from Supabase.
 * Exchanges the `code` parameter for a session.
 * Redirects to homepage ('/') if successful, or to '/login?error=auth_callback_failed' on failure.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : `/${rawNext}`;

  console.log("Callback route hit, code:", code);

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
      });
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error exchanging code for session:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_callback_failed", origin)
        );
      }

      if (data?.user) {
        try {
          const { syncUserCityOnLogin } = await import("@/app/actions/city");
          await syncUserCityOnLogin(data.user.id);
        } catch (cityErr) {
          console.error("Error syncing city on login:", cityErr);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_failed", origin)
      );
    }
  }

  // If code was missing, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin)
  );
}
