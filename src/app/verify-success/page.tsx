"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function VerifySuccessPage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-slate-900 ${inter.className}`}
    >
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center shadow-sm">

          {/* ── Success icon ─────────────────────────────────────────────── */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-5">
            <CheckCircle className="h-7 w-7 text-green-600" strokeWidth={2} />
          </div>

          {/* ── Heading ──────────────────────────────────────────────────── */}
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Email Verified Successfully!
          </h1>

          {/* ── Subtext ──────────────────────────────────────────────────── */}
          <p className="text-sm text-slate-500 mb-7 leading-relaxed">
            Your account is now active. You can log in and start exploring
            events.
          </p>

          {/* ── Action button ────────────────────────────────────────────── */}
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-slate-900 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            Proceed to Login
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
