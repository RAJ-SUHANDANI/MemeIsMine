import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { SiteFooter } from "@/components/site-chrome";
import { SiteHeader } from "@/components/site";
import { safeJsonLd, siteAbsolute } from "@/lib/site-seo";

const questions=[
  {
    q:"What is Meme Is Mine?",
    a:"Meme Is Mine is a browser-based meme maker with image templates, looping video and GIF previews, caption editing, exports, and a personal Studio for saved work.",
  },
  {
    q:"Can I create video memes?",
    a:"Yes. Choose a clip in Video Templates, watch the silent looping preview, open it in the editor, add captions, and export a supported video format. Browser and source-file support can vary.",
  },
  {
    q:"Is Meme Is Mine free to use?",
    a:"Yes. You can browse and preview image and video meme templates without paying or signing in. A free account is required to edit memes, save drafts in Studio, and like templates.",
  },
  {
    q:"How do I create an account and verify my email?",
    a:"Choose Create account, enter your email address and a unique password, then enter the six-digit code sent to your inbox. Verification requires a correctly configured email-delivery service on the website server.",
  },
  {
    q:"Can I make a meme with my own image?",
    a:"Yes. Choose Upload your image and select a JPG, PNG or WebP file from your device. You can position captions and export the finished result.",
  },
  {
    q:"How do I download a finished meme?",
    a:"Open an image template in the editor, add text, and choose an available PNG or JPG export. Video templates support the formats offered by your browser and the editor.",
  },
  {
    q:"Where are my saved meme drafts stored?",
    a:"Drafts, collections and bookmarks are kept in the current browser's local storage, not synchronized across devices. Sign-in does not automatically transfer them. Studio provides a manual backup option.",
  },
  {
    q:"Why does a video or image template sometimes fail?",
    a:"Some template files are hosted by external media services. If a source is offline, blocks requests, or changes its URL, a preview may be unavailable. Try another template or upload your own image.",
  },
  {
    q:"Can I use downloaded memes commercially?",
    a:"It depends on the original image, video and applicable rights. Use only media you have permission to edit or share, especially for commercial projects.",
  },
  {
    q:"Can I make memes on a phone?",
    a:"The site offers a responsive interface for mobile browsing and creation. Video processing support and export performance may depend on your device and browser.",
  },
  {
    q:"Does the website use AI to write my memes?",
    a:"No. The current version is a manual meme maker: you choose the template and write the caption yourself.",
  },
];
const schema={
 "@context":"https://schema.org",
 "@type":"FAQPage",
 mainEntity:questions.map(item=>({
   "@type":"Question",name:item.q,
   acceptedAnswer:{"@type":"Answer",text:item.a},
 })),
 url:siteAbsolute("/faq"),
};

export default function FAQPage(){
 return <main id="main-content" tabIndex={-1} className="paper-noise rf-support-page rf-faq-page">
   <SiteHeader/>
   <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(schema)}}/>
   <section className="page-hero"><div className="container">
     <span className="eyebrow">Answers before you begin</span>
     <h1>Good to <span>know.</span></h1>
     <p>Clear answers about image memes, video templates, saving drafts, downloads, account verification and privacy.</p>
   </div></section>
   <section className="section"><div className="container faq-layout">
     <div className="faq-intro">
       <span className="eyebrow">A GUIDE TO MAKING MEMES</span>
       <h2 className="page-display">NO MYSTERY.<br/><em>JUST MEMES.</em></h2>
       <p>Find the right format, create your own caption and keep control of the final result.</p>
       <Link href="/contact" className="button button-dark">Ask a question <ArrowUpRight size={17}/></Link>
     </div>
     <div className="faq-list">
       {questions.map((item,index)=><details key={item.q} className="faq-item" open={index===0}>
         <summary className="faq-question">
           <span><small>{String(index+1).padStart(2,"0")}</small>{item.q}</span>
           <ChevronDown size={20} aria-hidden="true"/>
         </summary>
         <div className="faq-answer"><p>{item.a}</p></div>
       </details>)}
     </div>
   </div></section>
   <SiteFooter/>
 </main>;
}
