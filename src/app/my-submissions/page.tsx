"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmissionsTable, { type SubmissionItem } from "@/components/SubmissionsTable";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const SUBMISSIONS_PER_PAGE = 10;

// Sub-component: Pagination
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  const btnBase =
    "w-8 h-8 flex items-center justify-center text-sm border rounded-sm transition-colors cursor-pointer select-none";
  const btnDefault =
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  const btnActive = "bg-[#186BA7] text-white border-[#186BA7] font-semibold";
  const btnDisabled = "opacity-40 cursor-not-allowed pointer-events-none";

  return (
    <div className="mt-5 flex items-center justify-center gap-2 select-none">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnDefault} ${currentPage === 1 ? btnDisabled : ""}`}
        aria-label="Previous page"
      >
        &#8249;
      </button>
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`${btnBase} ${currentPage === p ? btnActive : btnDefault}`}
            aria-current={currentPage === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${btnDefault} ${currentPage === totalPages ? btnDisabled : ""}`}
        aria-label="Next page"
      >
        &#8250;
      </button>
    </div>
  );
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / SUBMISSIONS_PER_PAGE));

  const fetchSubmissions = useCallback(async (userId: string, page: number) => {
    setIsLoadingSubmissions(true);
    try {
      const from = (page - 1) * SUBMISSIONS_PER_PAGE;
      const to = page * SUBMISSIONS_PER_PAGE - 1;

      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("organizer_id", userId);

      setTotalCount(count ?? 0);

      const { data, error } = await supabase
        .from("events")
        .select("id, event_name, event_date, status, city, review_notes")
        .eq("organizer_id", userId)
        .order("event_date", { ascending: false })
        .range(from, to);

      if (!error && data) {
        console.log("[MySubmissions] Fetched submissions for user", userId, data);
        setSubmissions(data as SubmissionItem[]);
      } else {
        if (error) console.error("[MySubmissions] Fetch error:", error);
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      setIsLoadingUser(true);
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);
        fetchSubmissions(currentUser.id, 1);
      } catch (err) {
        console.error("Error loading user:", err);
        router.push("/login");
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUser();
  }, [router, fetchSubmissions]);

  const handlePageChange = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(clamped);
    if (user) {
      fetchSubmissions(user.id, clamped);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">
            Loading...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl font-bold text-slate-900">
                  My Submissions{totalCount > 0 ? ` (${totalCount})` : ""}
                </h1>
                <p className="text-xs text-slate-500 mt-1">Manage events you have submitted</p>
              </div>
              <Link
                href="/dashboard?tab=submissions"
                className="text-sm font-medium text-[#186BA7] hover:underline flex items-center gap-1 sm:ml-auto mt-1 sm:mt-0 w-fit"
              >
                &larr; Back to Dashboard
              </Link>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-t-sm rounded-b-none overflow-hidden bg-white shadow-sm">
              <SubmissionsTable
                submissions={submissions}
                isLoading={isLoadingSubmissions}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
