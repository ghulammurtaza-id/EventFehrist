"use client";

import { useState } from "react";

const eligibilityOptions = [
  "Students only",
  "University students",
  "Open to all",
  "Professionals",
] as const;

const competitionOptions = [
  "Beginner friendly",
  "With prizes",
  "Certificate",
] as const;

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 cursor-pointer accent-[#186BA7] dark:accent-[#60a5fa]"
      />
      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors select-none">
        {label}
      </span>
    </label>
  );
}

export default function Sidebar() {
  const [eligibility, setEligibility] = useState<string[]>([]);
  const [competition, setCompetition] = useState<string[]>([]);

  function toggleEligibility(val: string) {
    setEligibility((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function toggleCompetition(val: string) {
    setCompetition((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  return (
    <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2e] rounded-t-md shadow-xs transition-colors">
      {/* Eligibility Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/80">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
          Eligibility
        </h3>
        <div className="space-y-2.5">
          {eligibilityOptions.map((opt) => (
            <CheckboxItem
              key={opt}
              label={opt}
              checked={eligibility.includes(opt)}
              onChange={() => toggleEligibility(opt)}
            />
          ))}
        </div>
      </div>

      {/* Competition Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/80">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
          Competition
        </h3>
        <div className="space-y-2.5">
          {competitionOptions.map((opt) => (
            <CheckboxItem
              key={opt}
              label={opt}
              checked={competition.includes(opt)}
              onChange={() => toggleCompetition(opt)}
            />
          ))}
        </div>
      </div>

      {/* Saved Events Section */}
      <div className="p-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
          Saved Events
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          0 saved{" "}
          <span className="text-xs text-slate-400 dark:text-slate-400">(Sign in to bookmark events)</span>
        </p>
      </div>
    </div>
  );
}
