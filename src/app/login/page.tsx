"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { loginUser } from "@/app/actions/auth";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showResetForm = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Forgot password states
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await loginUser(email, password);

      if (!res.success) {
        setErrorMessage(res.error || "Login failed");
        setPassword("");
        setIsLoading(false);
        return;
      }

      router.refresh();
      router.push(res.redirectTo || "/");
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      setErrorMessage(
        err?.message || "An unexpected error occurred. Please try again."
      );
      setPassword("");
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/update-password",
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          error.status === 429;
        setResetError(
          isRateLimit
            ? "Too many attempts. Please try again in 1 hour."
            : error.message
        );
        setResetLoading(false);
        return;
      }

      setResetSuccess(true);
    } catch {
      setResetError("An unexpected error occurred. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[430px] bg-white border border-slate-200 rounded-sm p-7 sm:p-8 shadow-sm">
          {showResetForm ? (
            <>
              {/* RESET FORM */}
              <div className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                RESET FORM
              </div>

              <hr className="border-t border-slate-200 mt-2 mb-5" />

              <h1 className="text-2xl font-normal text-slate-900 mb-6">
                Password reset
              </h1>

              {resetSuccess ? (
                <>
                  {/* Success message */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    If an account exists with this email, we have sent a password
                    reset link. Please check your inbox.
                  </p>
                </>
              ) : (
                <>
                  {/* Reset error */}
                  {resetError && (
                    <div
                      className="w-full text-sm text-red-600 font-medium mb-4 text-left"
                      role="alert"
                    >
                      {resetError}
                    </div>
                  )}

                  {/* Reset form */}
                  <form onSubmit={handleReset}>
                    <div>
                      <label
                        htmlFor="reset-email"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        Email
                      </label>
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                    </div>

                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Enter the email linked to your account.
                    </p>

                    <div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className={`px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer ${
                          resetLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {resetLoading ? "Sending..." : "Send Reset Link"}
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
            </>
          ) : (
            <>
              {/* LOGIN FORM */}
              {/* Top category label */}
              <div className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                LOG IN
              </div>

              <hr className="border-t border-slate-200 mt-2 mb-5" />

              {/* Heading */}
              <h1 className="text-2xl font-normal text-slate-900 mb-6">
                Welcome back
              </h1>

              {/* Error Message (Top of form for mobile UX) */}
              {errorMessage && (
                <div
                  className="w-full text-sm text-red-600 font-medium mb-4 text-left"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-slate-900 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
                  />
                </div>

                {/* Forgot password */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail("");
                      setResetError("");
                      setResetSuccess(false);
                      router.push("/login?reset=true");
                    }}
                    className="text-xs text-[#186BA7] hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Log in Button — Exact homepage Filter/Reset button style */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer inline-flex items-center justify-center gap-2 ${
                      isLoading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-3.5 w-3.5 text-slate-700"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      "Log in"
                    )}
                  </button>
                </div>
              </form>

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
            </>
          )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-slate-900 ${inter.className}`}
    >
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense
          fallback={
            <div className="w-full max-w-[430px] bg-white border border-slate-200 rounded-sm p-7 sm:p-8 shadow-sm flex items-center justify-center min-h-[300px] text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

