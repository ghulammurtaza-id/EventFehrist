import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "About - Fehrist",
  description:
    "Fehrist is Pakistan's first centralized event discovery directory. Our mission is simple: to bridge the gap between event organizers and students, professionals, and enthusiasts across the country.",
};

export default function AboutPage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 ${openSans.className}`}
    >
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* ── Page Title ──────────────────────────────────────────────────── */}
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          About Fehrist
        </h1>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-6">
          Fehrist is Pakistan&apos;s first centralized event discovery directory. Our
          mission is simple: to bridge the gap between event organizers and
          students, professionals, and enthusiasts across the country. No more
          missing out on hackathons, workshops, or conferences because they were
          buried in a social media feed.
        </p>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-8" />

        {/* ── Open Source ─────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Open Source
        </h2>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-4">
          Fehrist is an open-source project. We believe that the best tools are
          built together. If you are a developer, designer, or student who wants to
          contribute, fix bugs, or add new features, we welcome you. Check out the
          source code and contribution guidelines on GitHub.
        </p>
        <p className="mb-6">
          <a
            href="https://github.com/YOUR_USERNAME/fehrist"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#186BA7] dark:text-[#60a5fa] font-medium text-sm md:text-base hover:underline inline-flex items-center gap-1"
          >
            View on GitHub &rarr;
          </a>
        </p>

        {/* ── Main Developer ──────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Main Developer
        </h2>
        <ul className="list-disc list-inside font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-6">

          <span className="font-medium text-slate-900 dark:text-slate-100">
            Ghulam Murtaza
          </span>{": "}
          Creator &amp; Lead Developer

        </ul>

        {/* ── Tech Stack ──────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Tech Stack
        </h2>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-3">
          This platform is built using modern, industry-standard web technologies:
        </p>
        <ul className="list-disc list-inside space-y-2 font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-6">
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              Framework:
            </strong>{" "}
            Next.js (React) for server-side rendering and routing.
          </li>
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              Styling:
            </strong>{" "}
            Tailwind CSS for a clean, responsive, and accessible UI.
          </li>
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              Deployment:
            </strong>{" "}
            Optimized for performance and scalability.
          </li>
        </ul>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Contact
        </h2>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-4">
          If you have a bug report, feature request, or just want to say hello, feel
          free to reach out:
        </p>
        <ul className="space-y-2.5 font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-6">
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              Feedback & Bugs:
            </strong>{" "}
            <a
              href="mailto:feedback@efehrist.com"
              className="text-[#186BA7] dark:text-[#60a5fa] hover:underline"
            >
              feedback@efehrist.com
            </a>
          </li>
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              General Query:
            </strong>{" "}
            <a
              href="mailto:perhlybhai@gmail.com"
              className="text-[#186BA7] dark:text-[#60a5fa] hover:underline"
            >
              perhlybhai@gmail.com
            </a>
          </li>
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              LinkedIn:
            </strong>{" "}
            <a
              href="https://linkedin.com/in/ghulam-murtaza-cs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#186BA7] dark:text-[#60a5fa] hover:underline"
            >
              Connect on LinkedIn
            </a>
          </li>
          <li>
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              GitHub:
            </strong>{" "}
            <a
              href="https://github.com/ghulammurtaza-id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#186BA7] dark:text-[#60a5fa] hover:underline"
            >
              View Profile
            </a>
          </li>
        </ul>
      </main>

      <Footer />
    </div>
  );
}
