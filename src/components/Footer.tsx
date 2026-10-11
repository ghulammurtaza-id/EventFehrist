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
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-14 py-5 sm:py-8">
        {/* Nav links */}
        <nav className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 sm:gap-x-5 sm:gap-y-2 mb-2.5 sm:mb-3">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] sm:text-sm font-medium no-underline text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
          © 2026 Fehrist · Pakistan&apos;s event discovery directory · All times PKT (UTC+5)
        </p>
      </div>
    </footer>
  );
}
