"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface SubmissionItem {
  id: string;
  event_name: string;
  event_date: string;
  status: string | null;
  city: string;
  review_notes?: string | null;
}

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

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
        setSubmissions(data as SubmissionItem[]);
      } else {
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
              {isLoadingSubmissions ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Loading your submissions...
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-slate-500 mb-3">
                    You have not submitted any events yet.
                  </p>
                  <Link
                    href="/submit"
                    className="inline-block text-xs sm:text-sm font-semibold border border-slate-300 bg-gray-100 text-slate-900 px-4 py-2 rounded-none hover:bg-gray-200 transition-colors"
                  >
                    Submit an Event
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[340px] md:min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                        <th className="py-3 px-4">Event Name</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                        <th className="py-3 px-4 hidden md:table-cell">City</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 pr-6 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {submissions.map((item) => {
                        const eventTitle = item.event_name || "Untitled Event";
                        const eventDate = formatDate(item.event_date);
                        const city = item.city || "Pakistan";
                        const rawStatus = (item.status || "Pending").trim();
                        const lowerStatus = rawStatus.toLowerCase();

                        const isApproved = lowerStatus === "approved";
                        const isPending = lowerStatus === "pending";
                        const isNeedsRevision =
                          lowerStatus === "needs revision" ||
                          lowerStatus === "needs_revision" ||
                          lowerStatus === "revision";
                        const isRejected = lowerStatus === "rejected";

                        const badgeCls = isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isPending
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : isNeedsRevision
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : isRejected
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-slate-100 text-slate-700 border-slate-300";

                        const badgeLabel: React.ReactNode = isApproved
                          ? "Approved"
                          : isPending
                            ? "Pending"
                            : isNeedsRevision
                              ? (
                                <>
                                  Needs <span className="block sm:inline">Revision</span>
                                </>
                              )
                              : isRejected
                                ? "Rejected"
                                : rawStatus;

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                <div>{eventTitle}</div>
                                <div className="sm:hidden text-xs text-slate-500 font-normal mt-1">
                                  {eventDate}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap hidden sm:table-cell align-top">
                                {eventDate}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell align-top">
                                {city}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <span
                                  className={`inline-block text-center text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-1.5 font-medium rounded-sm border leading-tight ${badgeCls}`}
                                >
                                  {badgeLabel}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 pr-6 text-left whitespace-nowrap min-w-[100px] align-top">
                                <Link
                                  href={`/submit?edit=${item.id}`}
                                  className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-sm bg-white text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Edit
                                </Link>
                              </td>
                            </tr>
                            {isNeedsRevision && item.review_notes && (
                              <tr key={`${item.id}-feedback`} className="border-t-0 bg-transparent">
                                <td colSpan={5} className="px-4 pb-3 pt-0 border-t-0">
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 pr-4 sm:pr-6 mt-2 mb-3 shadow-sm">
                                    <p className="font-bold text-orange-900 text-sm mb-2">Reviewer feedback:</p>
                                    <p className="text-orange-800 text-sm leading-relaxed break-words">{item.review_notes}</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
