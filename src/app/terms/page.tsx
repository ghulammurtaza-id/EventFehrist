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
  title: "Terms of Service — Fehrist",
  description:
    "These terms outline the simple rules for using our platform. By browsing or submitting events, you agree to help us keep this community safe, accurate, and spam-free.",
};

export default function TermsOfServicePage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 ${openSans.className}`}
    >
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* ── Page Title ──────────────────────────────────────────────────── */}
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Terms of Service
        </h1>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
          These terms outline the simple rules for using our platform. By
          browsing or submitting events, you agree to help us keep this
          community safe, accurate, and spam-free.
        </p>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-8" />

        {/* ── Section 1 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          What this platform is (and isn&apos;t)
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          This platform is a directory to help you discover events happening in
          Pakistan. We are a bridge, not the destination. We do not host the
          events, we do not sell tickets, and we do not process payments. When you
          register for an event, you are entering into an agreement with the event
          organizer, not with us.
        </p>

        {/* ── Section 2 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Your responsibilities as a user
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We want this to be a safe, useful community. You agree not to use this
          platform to spam, post fake events, scrape our data, or harass other
          users. If you submit an event, you confirm that the information is
          accurate and that you have the right to share it. If you break these
          rules, we reserve the right to ban your account without warning.
        </p>

        {/* ── Section 3 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Event submissions and moderation
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Anyone can submit an event, but not every event goes live immediately.
          All submissions go through a moderation process where our admin team
          reviews them for quality and accuracy. We reserve the right to reject,
          edit, or remove any event that doesn&apos;t meet our standards, is spam,
          or contains incorrect information. We do this to keep the directory
          clean and trustworthy.
        </p>

        {/* ── Section 4 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Our limitations (No guarantees)
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We work hard to keep the information on this site accurate, but we are
          human. Event organizers might change dates, cancel events, or break
          their registration links without telling us. We cannot guarantee that
          every listing is 100% up-to-date, and we are not liable if you travel to
          a cancelled venue or encounter a broken third-party link. Always
          double-check with the organizer. However, if you spot an outdated,
          cancelled, or broken event, please help us keep the community clean by
          clicking the &apos;Report&apos; button on that event&apos;s page.
        </p>

        {/* ── Section 5 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Changes to these terms
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          As we grow and add new features, these rules might change. If we make
          significant changes, we will notify you via email or a notification on
          the site. By continuing to use the platform after changes are made, you
          agree to the new terms.
        </p>
      </main>

      <Footer />
    </div>
  );
}
