import type { Metadata } from "next";
export const metadata: Metadata = { title: "Meme editor" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
