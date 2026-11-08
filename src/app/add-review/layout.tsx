import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your feedback" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
