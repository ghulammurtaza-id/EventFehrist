"use client";

import { useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/update-password",
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          error.status === 429;
        setErrorMessage(
          isRateLimit
            ? "Too many attempts. Please try again in 1 hour."
            : error.message
        );
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-slate-900 ${inter.className}`}
    >
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[430px] bg-white border border-slate-200 rounded-sm p-7 sm:p-8 shadow-sm">
          {/* Top category label */}
          <div className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
            RESET FORM
          </div>

          <hr className="border-t border-slate-200 mt-2 mb-5" />

          {/* Heading */}
          <h1 className="text-2xl font-normal text-slate-900 mb-6">
            Password reset
          </h1>

          {success ? (
            <>
              {/* Success message */}
              <p className="text-sm text-slate-600 leading-relaxed">
                If an account exists with this email, we have sent a password
                reset link. Please check your inbox.
              </p>
            </>
          ) : (
            <>
              {/* Error Message */}
              {errorMessage && (
                <div
                  className="w-full text-sm text-red-600 font-medium mb-4 text-left"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-900 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
                  />
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Enter the email linked to your account.
                </p>

                {/* Send Reset Link Button — Same style as login button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Bottom link */}
          <div className="mt-5 text-xs text-slate-600">
            New here?{" "}
            <Link
              href="/signup"
              className="text-[#186BA7] hover:underline font-medium"
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
