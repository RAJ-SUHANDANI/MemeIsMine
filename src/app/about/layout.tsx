import type { Metadata } from "next";
export const metadata: Metadata = { title: "About Raj" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
