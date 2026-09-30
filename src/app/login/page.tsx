import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Log in — Fehrist",
  description:
    "Log in to Fehrist to bookmark events, track schedules, and manage your event listings.",
};

export default function LoginPage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 ${inter.className}`}
    >
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[430px] bg-white dark:bg-[#151d2e] border border-slate-200 dark:border-slate-800 rounded-sm p-7 sm:p-8 shadow-sm">
          {/* Top category label */}
          <div className="text-[11px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
            LOG IN
          </div>

          <hr className="border-t border-slate-200 dark:border-slate-700/80 mt-2 mb-5" />

          {/* Heading */}
          <h1 className="text-2xl font-normal text-slate-900 dark:text-slate-100 mb-6">
            Welcome back
          </h1>

          {/* Form */}
          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Forgot password */}
            <div className="pt-0.5">
              <Link
                href="/forgot-password"
                className="text-xs text-[#186BA7] dark:text-[#60a5fa] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Log in Button — Exact homepage Filter/Reset button style */}
            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer"
              >
                Log in
              </button>
            </div>
          </form>

          {/* Bottom link */}
          <div className="mt-5 text-xs text-slate-600 dark:text-slate-400">
            New here?{" "}
            <Link
              href="/signup"
              className="text-[#186BA7] dark:text-[#60a5fa] hover:underline font-medium"
            >
              Create an account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
