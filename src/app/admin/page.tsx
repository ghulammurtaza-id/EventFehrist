"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

type AdminSection =
  | "moderation"
  | "content-growth"
  | "user-community"
  | "analytics";

interface MenuItem {
  id: AdminSection;
  label: string;
  heading: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "moderation",
    label: "Core Moderation",
    heading: "Core Moderation Dashboard",
    description: "Review pending submissions, manage revisions, and moderate event listings.",
    icon: ShieldCheck,
  },
  {
    id: "content-growth",
    label: "Content and Growth",
    heading: "Content and Growth Dashboard",
    description: "Oversee featured events, SEO performance, categories, and platform reach.",
    icon: TrendingUp,
  },
  {
    id: "user-community",
    label: "User and Community Management",
    heading: "User and Community Management Dashboard",
    description: "Manage organizers, permissions, user roles, and community reports.",
    icon: Users,
  },
  {
    id: "analytics",
    label: "Analytics",
    heading: "Analytics Dashboard",
    description: "Track platform engagement, visitor trends, click-through rates, and event views.",
    icon: BarChart3,
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("moderation");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Authenticate user & check admin role
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // Fetch user profile to verify role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        // If not admin, user can be notified or redirected
        if (profile && profile.role !== "admin") {
          // Allow access if testing or redirect if strictly restricted
          console.warn("User role is not admin:", profile.role);
        }
      } catch (err) {
        console.error("Error verifying admin access:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  const activeItem =
    MENU_ITEMS.find((item) => item.id === activeSection) || MENU_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoadingAuth ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-500">
            Verifying admin credentials...
          </div>
        ) : (
          <>
            {/* ── Top Header ────────────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-t-sm rounded-b-none p-4 sm:p-6 bg-white mb-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-[#186BA7]/10 text-[#186BA7] px-2 py-0.5 rounded-xs">
                      Administration
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Centralized management and platform oversight for Fehrist.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-sm">
                    Active Module:{" "}
                    <span className="font-semibold text-slate-900">
                      {activeItem.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile Navigation Dropdown/Accordion ──────────────────── */}
            <div className="block md:hidden mb-4">
              <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-sm font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors"
                  aria-expanded={isMobileMenuOpen}
                >
                  <div className="flex items-center gap-2.5">
                    <ActiveIcon className="w-4 h-4 text-[#186BA7]" />
                    <span>{activeItem.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-normal text-slate-500">
                    <span>Menu</span>
                    {isMobileMenuOpen ? (
                      <X className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Menu className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                </button>

                {isMobileMenuOpen && (
                  <div className="border-t border-slate-200 divide-y divide-slate-100 bg-white">
                    {MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs sm:text-sm transition-colors ${
                            isSelected
                              ? "bg-slate-100 text-slate-900 font-bold border-l-3 border-[#186BA7]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isSelected ? "text-[#186BA7]" : "text-slate-500"
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#186BA7]">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Desktop & Tablet Layout: Sidebar + Main Content ───────── */}
            <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[580px]">
              {/* Left Sidebar (Desktop) */}
              <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 bg-white flex-shrink-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Navigation Menu
                  </p>
                </div>

                <nav className="p-3 space-y-1.5 flex-1">
                  {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border ${
                          isSelected
                            ? "bg-slate-100 text-slate-900 border-slate-400 font-semibold"
                            : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${
                              isSelected ? "text-[#186BA7]" : "text-slate-500"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Main Content Area */}
              <section className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 bg-white flex flex-col justify-between">
                <div>
                  {/* Section Heading Placeholder */}
                  <div className="border-b border-slate-200 pb-5 mb-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ActiveIcon className="w-6 h-6 text-[#186BA7]" />
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                        {activeItem.heading}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {activeItem.description}
                    </p>
                  </div>

                  {/* Placeholder Content Shell */}
                  <div className="border border-dashed border-slate-300 rounded-sm p-8 sm:p-12 text-center bg-slate-50/50">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 text-[#186BA7] mb-4 shadow-2xs">
                      <ActiveIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                      {activeItem.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                      Navigation shell initialized. Tables, filters, and actions for{" "}
                      <span className="font-medium text-slate-700">
                        {activeItem.label}
                      </span>{" "}
                      will be integrated here.
                    </p>
                  </div>
                </div>

                {/* Footer Note inside card */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Fehrist Admin Suite</span>
                  <span>Section: {activeItem.label}</span>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
