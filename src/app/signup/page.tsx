"use client";

import { useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  // Verification-pending state — set when data.user exists but data.session is null
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setIsExistingAccount(false);
    setIsVerificationPending(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          // ✅ Fix 1: Route through /auth/callback so exchangeCodeForSession runs
          emailRedirectTo: window.location.origin + "/auth/callback",
        },
      });

      // Detect if account already exists (identities array is empty on duplicate)
      const isAlreadyRegistered =
        error?.message?.toLowerCase().includes("already") ||
        error?.message?.toLowerCase().includes("exists") ||
        (data?.user?.identities && data.user.identities.length === 0);

      if (isAlreadyRegistered) {
        setIsExistingAccount(true);
        setErrorMessage("An account with this email already exists. Please log in.");
        setPassword("");
        setIsLoading(false);
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setPassword("");
        setIsLoading(false);
        return;
      }

      // ✅ Fix 2: Explicit verification-pending check.
      // data.user exists but data.session is null = email confirmation required.
      if (data.user && !data.session) {
        setVerificationEmail(data.user.email ?? email);
        setIsVerificationPending(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setPassword("");
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
            SIGN UP
          </div>

          <hr className="border-t border-slate-200 mt-2 mb-5" />

          {/* Heading */}
          <h1 className="text-2xl font-normal text-slate-900 mb-6">
            Create Account
          </h1>

          {/* Error Message (Top of form for mobile UX) */}
          {errorMessage && (
            <div
              className="w-full text-sm text-red-600 font-medium mb-4 text-left"
              role="alert"
            >
              <span>{errorMessage}</span>
              {isExistingAccount && (
                <>
                  {" "}
                  <Link
                    href="/login"
                    className="text-[#186BA7] font-medium hover:underline inline-block"
                  >
                    Go to Login
                  </Link>
                </>
              )}
            </div>
          )}

          {/* ✅ Fix 3: Proper "Check your inbox" UI — shown when email confirmation is pending */}
          {isVerificationPending ? (
            <div className="text-center py-2">
              {/* Mail icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mb-5">
                <Mail className="h-7 w-7 text-[#186BA7]" strokeWidth={1.75} />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Check your inbox
              </h2>

              <p className="text-sm text-slate-500 mb-1 leading-relaxed">
                We&apos;ve sent a verification link to
              </p>
              <p className="text-sm font-semibold text-slate-800 mb-6 break-all">
                {verificationEmail}
              </p>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Click the link in that email to activate your account. Check your spam folder if you don&apos;t see it.
              </p>

              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 text-sm font-semibold text-slate-900 bg-slate-200 hover:bg-slate-300 active:bg-slate-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-sm"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-bold text-slate-900 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* Email */}
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

              {/* Password */}
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-none focus:border-[#186BA7] focus:outline-none transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* Create Account Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </button>
              </div>
            </form>
          )}

          {/* Bottom link */}
          <div className="mt-5 text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#186BA7] hover:underline font-medium"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
