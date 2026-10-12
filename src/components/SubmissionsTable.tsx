"use client";

import React from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

export interface SubmissionItem {
  id: string;
  event_name: string;
  event_date: string;
  status: string | null;
  city: string;
  review_notes?: string | null;
}

interface SubmissionsTableProps {
  submissions: SubmissionItem[];
  isLoading?: boolean;
}

// Format date helper like "Oct 5"
function formatDate(dateStr?: string) {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function SubmissionsTable({
  submissions,
  isLoading = false,
}: SubmissionsTableProps) {
  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Loading your submissions...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-slate-500 mb-3">
          You have not submitted any events yet.
        </p>
        <Link
          href="/submit-event"
          className="inline-block text-xs sm:text-sm font-semibold border border-slate-300 bg-gray-100 text-slate-900 px-4 py-2 rounded-none hover:bg-gray-200 transition-colors"
        >
          Submit an Event
        </Link>
      </div>
    );
  }

  return (
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

            // Standardized status matching
            const rawStatus = (item.status || "Pending").trim();
            const lowerStatus = rawStatus.toLowerCase();

            const isNeedsRevision =
              rawStatus === "Needs Revision" ||
              lowerStatus === "needs revision" ||
              lowerStatus === "needs_revision";

            const isRejected =
              rawStatus === "Rejected" ||
              lowerStatus === "rejected";

            const getStatusBadge = (status: string) => {
              if (status === "Needs Revision" || status.toLowerCase() === "needs revision" || status.toLowerCase() === "needs_revision") {
                return (
                  <span className="inline-block text-center text-xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1 font-semibold rounded-sm border bg-orange-50 text-orange-700 border-orange-200 leading-tight">
                    Needs Revision
                  </span>
                );
              }
              if (status === "Approved" || status.toLowerCase() === "approved") {
                return (
                  <span className="inline-block text-center text-xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1 font-semibold rounded-sm border bg-emerald-50 text-emerald-700 border-emerald-200 leading-tight">
                    Approved
                  </span>
                );
              }
              if (status === "Rejected" || status.toLowerCase() === "rejected") {
                return (
                  <span className="inline-block text-center text-xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1 font-semibold rounded-sm border bg-red-50 text-red-700 border-red-200 leading-tight">
                    Rejected
                  </span>
                );
              }
              // Default: Pending
              return (
                <span className="inline-block text-center text-xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1 font-semibold rounded-sm border bg-amber-50 text-amber-700 border-amber-200 leading-tight">
                  Pending
                </span>
              );
            };

            return (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-slate-50/70 transition-colors">
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
                    {getStatusBadge(rawStatus)}
                  </td>
                  <td className="py-3.5 px-4 pr-6 text-left whitespace-nowrap align-top">
                    {isRejected ? (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        title="Rejected events cannot be edited"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-sm bg-slate-50 text-slate-500 opacity-50 cursor-not-allowed select-none w-fit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    ) : (
                      <Link
                        href={`/submit-event?id=${item.id}&mode=edit`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-sm bg-white text-slate-900 hover:bg-slate-50 transition-colors w-fit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>

                {/* Reviewer feedback or Rejection reason box */}
                {(isNeedsRevision || isRejected) && item.review_notes && (
                  <tr key={`${item.id}-feedback`} className="border-t-0 bg-transparent">
                    <td colSpan={5} className="px-4 pb-3 pt-0 border-t-0">
                      <div
                        className={`rounded-lg p-3 sm:p-4 pr-4 sm:pr-6 mt-2 mb-3 shadow-sm border ${
                          isRejected
                            ? "bg-red-50 border-red-200"
                            : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <p
                          className={`font-bold text-sm mb-2 ${
                            isRejected ? "text-red-900" : "text-orange-900"
                          }`}
                        >
                          {isRejected ? "Rejection Reason:" : "Reviewer feedback:"}
                        </p>
                        <p
                          className={`text-sm leading-relaxed break-words ${
                            isRejected ? "text-red-800" : "text-orange-800"
                          }`}
                        >
                          {item.review_notes}
                        </p>
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
  );
}
