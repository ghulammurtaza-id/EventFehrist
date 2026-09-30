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
  title: "Privacy Policy — Fehrist",
  description:
    "Users fear data misuse. In Pakistan, WhatsApp spam and phone number, mails leaks are massive pain points. We need to explicitly address that fear immediately.",
};

export default function PrivacyPolicyPage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 ${openSans.className}`}
    >
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* ── Page Title ──────────────────────────────────────────────────── */}
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Privacy Policy
        </h1>
        <p className="font-normal text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
          Users fear data misuse. In Pakistan, WhatsApp spam and phone number, mails
          leaks are massive pain points. We need to explicitly address that fear
          immediately.
        </p>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-8" />

        {/* ── Section 1 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          What information we collect from you
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We only collect what we absolutely need to make this platform work. When you
          create an account, we ask for your name, email address, and your preferred
          city so we can show you relevant events. If you submit an event, we collect
          the details you provide about that event. We do not ask for your phone
          number, CNIC, or home address unless it is strictly necessary for a
          specific feature in the future.
        </p>

        {/* ── Section 2 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          How we use your information
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We use your data for one main reason: to connect you with events. Your
          email is used to send you login details, important updates about events you
          saved, or notifications about new events in your city. We do not use your
          data to build a profile to sell to advertisers. If we ever change how we
          use your data, we will tell you first.
        </p>

        {/* ── Section 3 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Do we share your data with anyone?
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          The short answer is no, we do not sell your personal data. The only
          exception is when you choose to register for an event. When you click
          &ldquo;Register&rdquo;, we send you to the organizer&apos;s website (like a
          Google Form or Eventbrite). At that point, the organizer&apos;s privacy
          policy applies, not ours. We also use basic, secure third-party services to
          host our website and process logins, but they are bound by strict
          confidentiality.
        </p>

        {/* ── Section 4 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Cookies and basic tracking
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We use very basic cookies to keep you logged in and to understand how many
          people are visiting our site so we can improve it. We don&apos;t use
          invasive tracking pixels to follow you around the internet. You can turn
          off cookies in your browser settings at any time, though it might make
          logging in slightly less convenient.
        </p>

        {/* ── Section 5 ───────────────────────────────────────────────────── */}
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">
          Your rights and deleting your account
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          You own your data. If you want to see what information we have on you, or
          if you want to delete your account entirely, just email us. We will remove
          your personal information from our active database within a few days,
          keeping only the bare minimum required for legal or security records.
        </p>
      </main>

      <Footer />
    </div>
  );
}
