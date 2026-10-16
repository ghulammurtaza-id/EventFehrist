"use client";

import { useState, useRef, useEffect } from "react";

interface CustomDropdownProps {
  value: string;
  options: readonly string[] | string[];
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export default function CustomDropdown({
  value,
  options,
  onChange,
  className = "",
  id,
  name,
  ariaLabel,
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative ${isOpen ? "z-50" : "z-10"} ${className || "w-full sm:w-[160px]"}`.trim()}
    >
      {name && <input type="hidden" name={name} value={value} />}
      {/* Dropdown Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || value}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full h-10 px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between gap-2 rounded-sm text-left shadow-xs ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50"
            : "hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer focus:outline-none focus:border-[#186BA7] dark:focus:border-[#60a5fa]"
        }`}
      >
        <span className="truncate">{value}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150${isOpen ? " rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-1 w-full min-w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm shadow-lg max-h-60 overflow-y-auto py-1 left-0 list-none m-0 p-0"
        >
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between gap-2 transition-colors${isSelected
                    ? " font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/40"
                    : ""
                  }`}
              >
                <span className="truncate">{option}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-[#186BA7] dark:text-[#60a5fa] shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
