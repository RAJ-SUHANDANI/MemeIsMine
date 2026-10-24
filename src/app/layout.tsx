import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Meme Is Mine | Make the internet yours", template: "%s | Meme Is Mine" },
  description: "Find the format. Make it yours. A playful, beautifully simple studio for creating and downloading memes.",
  applicationName: "Meme Is Mine",
  keywords: ["meme maker", "meme editor", "meme templates", "download memes"],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
