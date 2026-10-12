"use client";

import React, { useState, useEffect } from "react";
import type { Announcement } from "@/app/actions/announcements";

interface AnnouncementBarProps {
  announcement?: Announcement | null;
}

export default function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  // Local state for visibility and closing animation
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Check localStorage for dismissal strictly on client mount to avoid hydration mismatch
  useEffect(() => {
    if (!announcement?.id) return;

    try {
      if (typeof window !== "undefined") {
        const dismissed = localStorage.getItem(`dismissed_announcement_${announcement.id}`);
        if (dismissed === "true") {
          setIsVisible(false);
        }
      }
    } catch (err) {
      // localStorage may be disabled in private browsing or restricted environments
      console.warn("[AnnouncementBar] Could not read localStorage:", err);
    }
  }, [announcement?.id]);

  // Handle dismissal: animate fade-out and persist to localStorage
  const handleDismiss = () => {
    setIsClosing(true);

    if (announcement?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem(`dismissed_announcement_${announcement.id}`, "true");
      } catch (err) {
        console.warn("[AnnouncementBar] Could not save dismissal to localStorage:", err);
      }
    }

    // Wait for the fade-out animation to complete before unmounting
    setTimeout(() => {
      setIsVisible(false);
    }, 250);
  };

  // If no announcement was provided or it has been dismissed, do not render
  if (!announcement || !isVisible) {
    return null;
  }

  const isExternal =
    Boolean(announcement.link_url && (announcement.link_url.startsWith("http://") || announcement.link_url.startsWith("https://")));

  return (
    <aside
      aria-label="Site announcement"
      className={`bg-[#dff0d8] dark:bg-[#132d20] border-b border-[#d0e9c6] dark:border-[#1b4330] w-full text-black dark:text-[#a7f3d0] transition-all duration-300 ease-out overflow-hidden ${
        isClosing ? "opacity-0 -translate-y-2 max-h-0 py-0" : "opacity-100 max-h-24"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        {/* Announcement Text & Dynamic Link */}
        <p className="text-xs sm:text-sm text-black dark:text-[#a7f3d0] flex-1 text-center">
          <span className="font-semibold">Announcement:</span>{" "}
          <span>{announcement.text_content}</span>
          {announcement.link_url && (
            <>
              {" "}
              <a
                href={announcement.link_url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="font-medium underline text-black dark:text-[#a7f3d0] hover:opacity-75 transition-opacity inline-flex items-center gap-0.5"
              >
                {announcement.link_text || "Details"}
              </a>
            </>
          )}
        </p>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="flex-shrink-0 text-black dark:text-[#a7f3d0] hover:opacity-70 transition-opacity p-1 rounded-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-[#a7f3d0]"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M11.5 3.5L3.5 11.5M3.5 3.5l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
