import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabaseClient";
import HomePageClient from "./HomePageClient";
import { mapDbRow } from "@/lib/mappers";
import type { Event } from "@/lib/mockData";

export default async function HomePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore as any,
  });

  // 1. Check if the user is logged in. If yes, use their primary_city from the profiles table.
  let resolvedCity: string | null = null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("primary_city")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.primary_city && profile.primary_city.trim()) {
        resolvedCity = profile.primary_city.trim();
      }
    }
  } catch (err) {
    console.error("Error reading user primary_city on server:", err);
  }

  // 2. If not logged in (or primary_city is null), read the selected_city cookie using import { cookies } from 'next/headers'
  if (!resolvedCity) {
    const cityCookie = cookieStore.get("selected_city")?.value;
    // 3. If the cookie exists, use that city to fetch events.
    if (cityCookie && cityCookie.trim()) {
      resolvedCity = decodeURIComponent(cityCookie.trim());
    }
  }

  // 4. If the cookie does NOT exist, fallback to 'Karachi' as the default, AND set the selected_city cookie to 'Karachi' for future visits.
  let shouldSetCookie = false;
  if (!resolvedCity) {
    resolvedCity = "Karachi";
    shouldSetCookie = true;
    try {
      cookieStore.set("selected_city", "Karachi", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    } catch {
      // In Server Components rendering, cookies cannot be set in response headers directly
    }
  }

  // URL query parameter takes precedence if explicitly provided by the user (e.g. ?city=Lahore)
  const urlCityParam =
    typeof searchParams?.city === "string" && searchParams.city.trim()
      ? searchParams.city.trim()
      : undefined;
  const initialCity = urlCityParam ?? resolvedCity;

  // Server-side initial query using the resolved city variable to prevent the "Karachi flash"
  const todayPKT = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Karachi",
  });

  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("status", "Approved")
    .gte("event_date", todayPKT);

  if (initialCity !== "All Cities") {
    query = query.eq("city", initialCity);
  }

  query = query
    .order("event_date", { ascending: true })
    .order("registration_deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(0, 9);

  let initialEvents: Event[] = [];
  let initialTotalCount = 0;

  try {
    const { data, count, error } = await query;
    if (!error && data) {
      initialEvents = data.map(mapDbRow);
      initialTotalCount = count ?? 0;
    } else if (error) {
      console.error("Initial server fetch error:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
        fullError: error,
      });
    }
  } catch (err) {
    console.error("Failed to fetch initial events on server:", err);
  }

  return (
    <HomePageClient
      initialCity={initialCity}
      initialEvents={initialEvents}
      initialTotalCount={initialTotalCount}
      shouldSetDefaultCookie={shouldSetCookie}
    />
  );
}
