import type { Metadata } from "next";
export const metadata: Metadata = { title: "Frequently asked questions" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
