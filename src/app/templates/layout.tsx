import type { Metadata } from "next";
export const metadata: Metadata = { title: "The meme index" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
