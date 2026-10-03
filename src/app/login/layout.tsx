import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — Fehrist",
  description:
    "Log in to Fehrist to bookmark events, track schedules, and manage your event listings.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
