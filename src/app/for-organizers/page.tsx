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
  title: "For Organizers - Fehrist",
  description: "List your events for free. Reach thousands across Pakistan.",
};

export default function ForOrganizersPage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 ${openSans.className}`}
    >
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* ── Page Title ──────────────────────────────────────────────────── */}
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          For Organizers
        </h1>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
          List your events for free. Reach thousands across Pakistan.
        </p>

        {/* ── Divider between Header and Why Us ───────────────────────────── */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-8" />

        {/* ── Why Us ──────────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Why Us
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-sm border border-slate-200 dark:border-slate-700/80">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Reach the Right Audience
            </h3>
            <p className="text-sm md:text-base font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
              Stop relying on scattered social media posts. Users on our
              platform actively filter by city, category, and interest. When a
              user is looking for an event that matches their needs, your
              listing appears at the exact right moment.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-sm border border-slate-200 dark:border-slate-700/80">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Zero Friction, Zero Cost
            </h3>
            <p className="text-sm md:text-base font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
              We are a discovery platform, not a ticketing company. Listing your
              event is 100% free. We don&apos;t take a cut of your registrations,
              and we don&apos;t force you to use our payment gateway (Google
              Forms, Eventbrite, etc.).
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-sm border border-slate-200 dark:border-slate-700/80">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Build Trust with a Verified Badge
            </h3>
            <p className="text-sm md:text-base font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
              Spam events ruin the experience for everyone. Once our admin team
              verifies your university society, company, or community group, you
              get a &ldquo;Verified Organizer&rdquo; badge. This instantly tells
              attendees that your event is legitimate and high-quality.
            </p>
          </div>
        </div>

        {/* ── Divider between Why Us and How It Works ─────────────────────── */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-8" />

        {/* ── How It Works ────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          How it works
        </h2>

        <ol className="space-y-3 mb-8">
          <li className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              1. Submit your details:
            </span>{" "}
            Fill out our simple form with your event name, date, location, and
            registration link.
          </li>
          <li className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              2. Quick review:
            </span>{" "}
            Our team manually reviews every submission to ensure quality and
            prevent spam. This usually takes 24&ndash;48 hours.
          </li>
          <li className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              3. Go live:
            </span>{" "}
            Once approved, your event is instantly visible to thousands of active
            users searching for opportunities in your city.
          </li>
        </ol>

        {/* ── CTA Button ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <a
            href="/submit"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer"
          >
            Submit Your Event
          </a>
        </div>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base">
          Have questions? Email us at{" "}
          <a
            href="mailto:efehrist@gmail.com"
            className="font-bold text-slate-900 dark:text-slate-100 hover:underline"
          >
            efehrist@gmail.com
          </a>
        </p>
      </main>

      <Footer />
    </div>
  );
}
