import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Submit Event", href: "/submit" },
  { label: "For Organizers", href: "/for-organizers" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#0b1120] mt-auto border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nav links */}
        <nav className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 mb-3">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold underline text-[#186BA7] dark:text-[#38bdf8] hover:opacity-80 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          © 2026 Fehrist · Pakistan&apos;s event discovery directory · All times PKT (UTC+5)
        </p>
      </div>
    </footer>
  );
}
