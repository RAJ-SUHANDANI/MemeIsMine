import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import type { Metadata } from "next";
import "./globals.css";
import "./studio-design.css";
import "./format-library.css";
import "./site-membership.css";
import "./gallery-experience.css";
import "./reframe.css";
import "./reframe-home.css";
import "./reframe-studio.css";
import "./reframe-support.css";
import "./reframe-footer.css";
import "./reframe-refinement.css";
import "./reframe-controls.css";
import "./reframe-auth.css";
import { MotionProvider } from "@/components/motion-provider";
export const metadata: Metadata = {
  title: {
    default: "Meme Is Mine | Make the internet yours",
    template: "%s | Meme Is Mine",
  },
  description:
    "Find the format. Make it yours. A playful, beautifully simple studio for creating and downloading memes.",
  metadataBase: new URL("https://memeismine.vercel.app"),
  icons: { icon: "/mim-mark.svg" },
  openGraph: {
    title: "Meme Is Mine",
    description:
      "Make image and video memes in your browser. Preview templates for free, then sign in to make them yours.",
    images: [{ url: "/editor-preview.jpg", width: 1395, height: 790 }],
  },
  applicationName: "Meme Is Mine",
  keywords: ["meme maker", "meme editor", "meme templates", "download memes"],
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
