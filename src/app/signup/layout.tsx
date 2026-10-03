import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Fehrist",
  description:
    "Create a Fehrist account to bookmark events, submit listings, and stay updated on competitions, hackathons and meetups across Pakistan.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
