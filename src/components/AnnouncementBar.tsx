// AnnouncementBar — dismissible green announcement strip.
// The parent (page.tsx) controls visibility via state and passes onClose.

interface AnnouncementBarProps {
  onClose: () => void;
}

export default function AnnouncementBar({ onClose }: AnnouncementBarProps) {
  return (
    <div className="bg-[#dff0d8] dark:bg-[#132d20] border-b border-[#d0e9c6] dark:border-[#1b4330] w-full text-black dark:text-[#a7f3d0] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-black dark:text-[#a7f3d0] flex-1 text-center">
          <span className="font-semibold">Announcement:</span>{" "}
          DragonByte Coding Challenge 2026 – Final Round in 6 days.{" "}
          <a
            href="#"
            className="font-medium underline text-black dark:text-[#a7f3d0] hover:opacity-75 transition-opacity"
          >
            Details
          </a>
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Dismiss announcement"
          className="flex-shrink-0 text-black dark:text-[#a7f3d0] hover:opacity-70 transition-opacity p-0.5 cursor-pointer"
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
    </div>
  );
}
