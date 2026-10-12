"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { submitReport } from "@/app/actions/reports";

const MAX_DESCRIPTION_LENGTH = 500;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  "Spam",
  "Fake Event",
  "Inappropriate Content",
  "Other",
] as const;

export default function ReportModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  onSuccess,
}: ReportModalProps) {
  const [reason, setReason] = useState<string>("Spam");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await submitReport(eventId, reason, description.trim() || undefined);
      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(res.error || "Failed to submit report.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIsSuccess(false);
    setDescription("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white w-full max-w-sm rounded-sm shadow-2xl flex flex-col overflow-hidden font-medium border border-slate-200">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ backgroundColor: "#292929" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 id="report-modal-title" className="text-sm font-semibold text-white tracking-wide">
              Report Event
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="text-slate-300 hover:text-white transition-colors p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Report Submitted</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thank you. Our moderators will review this listing.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {eventName && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs text-xs text-slate-700">
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Reporting
                  </span>
                  <span className="font-semibold line-clamp-1">{eventName}</span>
                </div>
              )}

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xs bg-white text-slate-800 focus:outline-hidden focus:border-[#186BA7] focus:ring-1 focus:ring-[#186BA7]"
                >
                  {REPORT_REASONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Your report will be reviewed by platform administrators.
                </p>
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Additional Details{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                      setDescription(e.target.value);
                    }
                  }}
                  rows={3}
                  placeholder="Please provide more details (optional)..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xs bg-white text-slate-800 resize-none focus:outline-hidden focus:border-[#186BA7] focus:ring-1 focus:ring-[#186BA7] placeholder:text-slate-400"
                />
                <p className={`text-[11px] mt-1 text-right ${
                  description.length >= MAX_DESCRIPTION_LENGTH
                    ? "text-red-500 font-semibold"
                    : description.length >= MAX_DESCRIPTION_LENGTH * 0.85
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-xs bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
