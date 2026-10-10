"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.full_name) {
        setFullName(profile.full_name);
      }
    } catch (err) {
      console.error("Error fetching user profile in navbar:", err);
    }
  };

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setFullName(currentUser.user_metadata?.full_name || "");
        fetchUserProfile(currentUser.id);
      } else {
        setFullName("");
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setFullName(currentUser.user_metadata?.full_name || "");
        fetchUserProfile(currentUser.id);
      } else {
        setFullName("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const displayName =
    fullName || user?.user_metadata?.full_name || user?.email || "Account";

  return (
    <nav className="relative z-50 w-full bg-[#292929] border-b border-[#3a3a3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 py-2.5">
          <Link href="/" prefetch={false} className="flex-shrink-0 flex items-center cursor-pointer">
            <Image
              src="/logo.png"
              alt="fehrist"
              width={120}
              height={32}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Profile text trigger */}
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group text-slate-200 hover:text-white transition-colors"
                >
                  <span className="font-sans font-medium text-[11px] md:text-sm truncate max-w-[100px] md:max-w-[150px]">
                    {displayName}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-white transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {/* Email header */}
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Nav links */}
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard?tab=settings"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-200 py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-100 hover:text-red-700 transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                prefetch={false}
                className="font-sans font-medium text-[11px] md:text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
