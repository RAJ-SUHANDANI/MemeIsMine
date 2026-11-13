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
import { PrivacyAnalytics } from "@/components/privacy-analytics";
import { safeJsonLd, siteOrigin } from "@/lib/site-seo";
const origin=siteOrigin();
export const metadata: Metadata = {
  title: {
    default: "Meme Is Mine — Free Image & Video Meme Templates and Meme Maker",
    template: "%s | Meme Is Mine",
  },
  description:
    "Browse image and video meme templates, preview looping reaction clips, add your own captions and download memes. Free template gallery and a personal browser-based meme studio.",
  metadataBase:new URL(origin),
  applicationName:"Meme Is Mine",
  alternates:{canonical:"/"},
  keywords:[
    "meme maker", "free meme templates", "image meme templates", "video meme templates",
    "meme generator", "make a meme online", "reaction memes", "meme editor",
  ],
  icons:{icon:"/mim-mark.svg"},
  openGraph:{
    type:"website",locale:"en_US",siteName:"Meme Is Mine",
    url:origin,
    title:"Meme Is Mine — Find a format. Make the punchline yours.",
    description:"Explore free image and video meme templates. Preview, caption and export your next meme in the browser.",
    images:[{url:"/editor-preview.jpg",width:1395,height:790,alt:"Meme Is Mine meme creation workspace"}],
  },
  twitter:{
    card:"summary_large_image",
    title:"Meme Is Mine — Free Meme Templates & Meme Maker",
    description:"Discover image memes and looping video templates, then make your own.",
    images:["/editor-preview.jpg"],
  },
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
  category:"entertainment",
};
const structured={
  "@context":"https://schema.org",
  "@graph":[
    {
      "@type":"WebSite",name:"Meme Is Mine",url:origin,
      description:"Browse image and video meme templates and create memes in your browser.",
      inLanguage:"en",
      potentialAction:{
        "@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:origin+"/explore?q={search_term_string}"},
        "query-input":"required name=search_term_string",
      },
    },
    {
      "@type":"WebApplication",name:"Meme Is Mine",url:origin,
      applicationCategory:"MultimediaApplication",operatingSystem:"Any",
      description:"A free browser-based meme maker with image and video templates, caption tools and local draft storage.",
      offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},
      browserRequirements:"Modern browser with JavaScript enabled",
      inLanguage:"en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <noscript><style>{".rf-intro{display:none!important}.rf-home-content-waiting{visibility:visible!important;pointer-events:auto!important}"}</style></noscript>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(structured)}}/>
        <MotionProvider>{children}</MotionProvider>
        <PrivacyAnalytics />
      </body>
    </html>
  );
}
