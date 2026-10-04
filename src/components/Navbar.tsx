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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    user?.user_metadata?.full_name || user?.email || "Account";

  return (
    <nav style={{ backgroundColor: "#292929" }} className="relative z-50 w-full border-b border-[#3a3a3a]">
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
                {/* Profile avatar trigger */}
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  {/* Avatar circle with initial */}
                  <span className="w-8 h-8 rounded-full bg-[#186BA7] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 group-hover:opacity-90 transition-opacity">
                    {(user.user_metadata?.full_name || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
                        href="/settings"
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
                className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
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
