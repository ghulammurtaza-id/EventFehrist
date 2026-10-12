"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Megaphone } from "lucide-react";
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput } from "@/app/actions/announcements";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: Announcement | null;
  onSubmit: (data: CreateAnnouncementInput | UpdateAnnouncementInput) => Promise<boolean>;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  announcement,
  onSubmit,
}: AnnouncementModalProps) {
  const isEditing = Boolean(announcement);

  const [textContent, setTextContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("Details");
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when modal opens or announcement changes
  useEffect(() => {
    if (announcement) {
      setTextContent(announcement.text_content || "");
      setLinkUrl(announcement.link_url || "");
      setLinkText(announcement.link_text || "Details");
      setIsActive(Boolean(announcement.is_active));
    } else {
      setTextContent("");
      setLinkUrl("");
      setLinkText("Details");
      setIsActive(false);
    }
    setErrorMessage(null);
  }, [announcement, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = textContent.trim();
    if (!trimmedText) {
      setErrorMessage("Text content is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CreateAnnouncementInput = {
        text_content: trimmedText,
        link_url: linkUrl.trim() || null,
        link_text: linkUrl.trim() ? (linkText.trim() || "Details") : (linkText.trim() || null),
        is_active: isActive,
      };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-modal-title"
        className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 shadow-xl my-8 transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#186BA7]/10 flex items-center justify-center text-[#186BA7]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 id="announcement-modal-title" className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Announcement" : "Create New Announcement"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? "Update announcement banner details." : "Add a new banner to the platform."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-sm transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 text-xs rounded-sm">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field: Text Content */}
          <div>
            <label htmlFor="text_content" className="block text-xs font-bold text-slate-900 mb-1">
              Text Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="text_content"
              rows={3}
              required
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="e.g. DragonByte Coding Challenge 2026 – Final Round in 6 days."
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-sm focus:outline-none focus:border-[#186BA7] text-slate-900 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Keep it concise and clear. This text will be displayed across the top banner.
            </p>
          </div>

          {/* Field: Link URL */}
          <div>
            <label htmlFor="link_url" className="block text-xs font-bold text-slate-900 mb-1">
              Link URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="link_url"
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/details or # or /events/123"
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-sm focus:outline-none focus:border-[#186BA7] text-slate-900 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              URL to navigate to when the user clicks the link.
            </p>
          </div>

          {/* Field: Link Text */}
          <div>
            <label htmlFor="link_text" className="block text-xs font-bold text-slate-900 mb-1">
              Link Text <span className="text-slate-400 font-normal">(Default: Details)</span>
            </label>
            <input
              id="link_text"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Details"
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-sm focus:outline-none focus:border-[#186BA7] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Field: Is Active */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#186BA7] focus:ring-[#186BA7]"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900">Set as Active Announcement</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Only one announcement can be active at a time. If checked, any previously active announcement will be deactivated automatically.
                </p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-[#186BA7] text-white hover:bg-[#155b8e] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
