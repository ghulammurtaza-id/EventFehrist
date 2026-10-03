"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityCombobox from "@/components/CityCombobox";
import { supabase } from "@/lib/supabaseClient";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("Karachi");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("Could not retrieve your account. Please log in again.");
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ primary_city: selectedCity })
        .eq("id", user.id);

      if (updateError) {
        setErrorMessage("Failed to save your city. Please try again.");
        setIsLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
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

          {/* Top label — exact "LOG IN" style */}
          <div className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
            PREFERENCES
          </div>

          <hr className="border-t border-slate-200 mt-2 mb-5" />

          {/* Heading */}
          <h1 className="text-2xl font-normal text-slate-900 mb-2">
            Select primary city
          </h1>

          {/* Subtext */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            We&apos;ll prioritize nearby events. You can change this later in
            your profile.
          </p>

          {/* Error */}
          {errorMessage && (
            <div
              className="w-full text-sm text-red-600 font-medium mb-4 text-left"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleContinue} className="space-y-5">
            {/* City selector */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Primary city
              </label>
              <CityCombobox
                value={selectedCity}
                onChange={setSelectedCity}
              />
            </div>

            {/* Continue button — exact Login button style */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-5 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Saving..." : "Continue to homepage"}
              </button>
            </div>
          </form>

          {/* Skip link */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-[#186BA7] hover:underline mt-4 block text-left w-full bg-transparent border-none p-0 cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
