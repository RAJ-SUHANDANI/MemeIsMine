import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your studio" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
