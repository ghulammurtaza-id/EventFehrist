import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Event - Fehrist",
  description:
    "Submit your tech conference, hackathon, workshop or meetup to Pakistan's centralized event directory.",
};

export default function SubmitEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
