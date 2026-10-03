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

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setIsExistingAccount(false);
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          // After email verification, land on onboarding (first-time only)
          emailRedirectTo: window.location.origin + "/onboarding",
        },
      });

      // Detect if account already exists
      const isAlreadyRegistered =
        error?.message?.toLowerCase().includes("already") ||
        error?.message?.toLowerCase().includes("exists") ||
        !data?.user ||
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

      setSuccessMessage("Account created! Please check your email to verify.");
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

          {/* Success Message */}
          {successMessage ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-none" role="status">
              {successMessage}
            </p>
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
