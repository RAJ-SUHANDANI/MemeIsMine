import type { Metadata } from "next";
export const metadata: Metadata = { title: "Video templates" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
