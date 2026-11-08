import type { Metadata } from "next";
export const metadata: Metadata = { title: "Video meme editor" };
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
