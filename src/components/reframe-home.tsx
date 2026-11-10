"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bookmark, Clapperboard, Download, Layers3, UploadCloud } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { starterMemes, type MemeTemplate } from "@/data/memes";
import { SiteHeader } from "./site";
import { SiteFooter } from "./site-chrome";
import { ReframeGallery } from "./reframe-gallery";
import { ReframeIntro } from "./reframe-intro";
import type { ReframeItem } from "./reframe-preview";

type HomeVideo={id:string;name:string;url:string;posterUrl:string;mediaType:"gif"|"video";sourcePage?:string;likeId?:string;category?:string};
const captionPresets=[
 {top:"ME: JUST FIVE MORE MINUTES",bottom:"ALSO ME: THREE HOURS LATER"},
 {top:"WHEN THE CODE WORKS",bottom:"BUT YOU DON'T KNOW WHY"},
 {top:"THE GROUP CHAT IS QUIET",bottom:"TIME TO CAUSE A PROBLEM"}
];
const questions=[
 {q:"Is it actually free?",a:"Yes. Browse and preview without an account. A free account unlocks the editors, likes and your personal Studio."},
 {q:"Where does my work go?",a:"Drafts and saved formats are stored in this browser. Signing in does not automatically sync them across devices."},
 {q:"Can I use my own images?",a:"Yes. Upload your own image, then add captions and effects in the existing editor."}
];
function asImage(m:MemeTemplate):ReframeItem{return {kind:"image",id:m.id,name:m.name,image:m.url,category:m.category,likeId:m.likeId,editorHref:"/create/"+encodeURIComponent(m.id)+(m.source==="indian"||m.source==="indianmemetemplates"?"?source=indian":""),sourceHref:m.originalUrl};}
function asVideo(v:HomeVideo):ReframeItem{return {kind:"video",id:v.id,name:v.name,image:v.posterUrl,category:v.category??"Moving image",likeId:v.likeId,editorHref:"/video-editor/"+encodeURIComponent(v.id),mediaUrl:v.url,mediaType:v.mediaType,sourceHref:v.sourcePage};}
function Reveal({children,className=""}:{children:React.ReactNode;className?:string}) {
 const reduced=useReducedMotion();
 return <motion.div className={className} initial={reduced?false:{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.16}} transition={{duration:.75,ease:[.22,1,.36,1]}}>{children}</motion.div>;
}
function CaptionArtifact({meme}:{meme:MemeTemplate}) {
 const [top,setTop]=useState(captionPresets[0].top);
 const [bottom,setBottom]=useState(captionPresets[0].bottom);
 const [preset,setPreset]=useState(0);
 function next(){const index=(preset+1)%captionPresets.length;setPreset(index);setTop(captionPresets[index].top);setBottom(captionPresets[index].bottom);}
 const href="/create/"+encodeURIComponent(meme.id)+"?top="+encodeURIComponent(top)+"&bottom="+encodeURIComponent(bottom);
 return <div className="rf-caption-workshop">
  <div className="rf-caption-head"><span>✳ LIVE CAPTION EXPERIMENT</span><span>01 / YOUR FIRST JOKE</span></div>
  <div className="rf-caption-stage">
   <Image src={meme.url} width={meme.width} height={meme.height} alt={meme.name+" template"}/>
   <div className="rf-caption-line rf-caption-top">{top}</div>
   <div className="rf-caption-line rf-caption-bottom">{bottom}</div>
  </div>
  <div className="rf-caption-fields">
   <label>THE SETUP <input value={top} onChange={e=>setTop(e.target.value)} maxLength={70} aria-label="Top caption"/></label>
   <label>THE PUNCHLINE <input value={bottom} onChange={e=>setBottom(e.target.value)} maxLength={70} aria-label="Bottom caption"/></label>
  </div>
  <div className="rf-caption-foot"><button type="button" onClick={next}>Try another joke <ArrowRight size={16}/></button><Link href={href}>Open full editor <ArrowUpRight size={16}/></Link></div>
 </div>;
}

export function ReframeHome({ initialImages, initialVideos }: {
 initialImages: MemeTemplate[];
 initialVideos: HomeVideo[];
}) {
 const reduced=useReducedMotion();
 const images=initialImages;
 const videos=initialVideos;
 return <main id="main-content" tabIndex={-1} className="rf-site rf-home">
  <ReframeIntro/><SiteHeader/>
  <section className="rf-home-hero">
   <div className="container rf-home-hero-grid">
    <motion.div className="rf-home-hero-copy" initial={reduced?false:{opacity:0,y:35}} animate={{opacity:1,y:0}} transition={{duration:.8,ease:[.22,1,.36,1]}}>
     <span className="rf-kicker"><span className="rf-kicker-star">✳</span> THE INTERNET IS YOUR CANVAS</span>
     <h1>Make<br/>some <em>noise.</em></h1>
     <p>Your next inside joke is waiting in the archive. Find a face, steal the moment, and make the punchline your own.</p>
     <div className="rf-home-hero-actions"><Link href="/explore" className="rf-home-primary">Find your format <ArrowUpRight size={20}/></Link><Link href="/create/upload" className="rf-home-secondary">Upload your image <UploadCloud size={17}/></Link></div>
     <div className="rf-hero-footnote"><span>NO AI WRITING THE JOKES.</span><span>JUST YOU & THE INTERNET.</span></div>
    </motion.div>
    <motion.div className="rf-home-hero-art" initial={reduced?false:{opacity:0,x:25,rotate:3}} animate={{opacity:1,x:0,rotate:0}} transition={{duration:.9,delay:.2,ease:[.22,1,.36,1]}}>
     <CaptionArtifact meme={starterMemes[0]}/>
    </motion.div>
   </div>
   <div className="rf-home-scroll-marker"><span>SCROLL TO EXPLORE</span><ArrowDownRight size={16}/></div>
  </section>
  <div className="rf-ticker" aria-hidden="true"><div>YOUR MEMES <b>✳</b> YOUR RULES <b>✳</b> SAME INTERNET DIFFERENT PUNCHLINE <b>✳</b> YOUR MEMES <b>✳</b> YOUR RULES <b>✳</b></div></div>
  <section className="rf-home-section rf-home-images">
   <div className="container">
    <Reveal className="rf-section-heading">
      <div><span className="rf-kicker">01 / THE STILL IMAGE DEPARTMENT</span><h2>Every face<br/>has <em>a story.</em></h2></div>
      <p>For the thoughts that need a face. Twenty-four formats moving on their own — drag, swipe or change the arrangement.</p>
    </Reveal>
    <ReframeGallery home kind="image" variant="showcase" path="/explore" items={images.map(asImage)}/>
    <div className="rf-section-end"><span>{images.length + " ACTUAL FORMATS · ENDLESSLY IN MOTION"}</span><Link href="/templates">See every image <ArrowUpRight size={18}/></Link></div>
   </div>
  </section>
  <section className="rf-home-editor-section">
   <div className="container rf-home-editor-layout">
    <Reveal className="rf-home-editor-copy"><span className="rf-kicker">02 / GET HANDS-ON</span>
      <h2>The joke is yours.<br/><em>So are the details.</em></h2><p>Take a format and make something that could not have come from anyone else. Move your captions, layer your graphics and pick your export.</p>
      <div className="rf-home-feature-list"><span><Layers3 size={21}/> Layer every detail</span><span><Bookmark size={21}/> Save for later</span><span><Download size={21}/> Download your result</span></div>
      <Link href="/explore" className="rf-inline-arrow">Find something to edit <ArrowUpRight size={19}/></Link>
    </Reveal>
    <Reveal className="rf-home-editor-frame"><div className="rf-editor-frame-label"><span>LOOK INSIDE THE STUDIO</span><span>REAL TOOLS, REAL EXPORTS</span></div>
      <Image src="/editor-preview.jpg" width={1395} height={790} alt="Meme Is Mine image editor screenshot" sizes="(max-width: 800px) 100vw, 60vw"/>
      <div className="rf-editor-frame-footer"><span>FRAME / CAPTION / FINISH</span><ArrowUpRight size={21}/></div>
    </Reveal>
   </div>
  </section>
  <section className="rf-home-section rf-home-videos">
   <div className="container">
    <Reveal className="rf-section-heading">
      <div><span className="rf-kicker">03 / THE MOVING IMAGE DEPARTMENT</span><h2>Some moments<br/><em>need motion.</em></h2></div>
      <p>A moving wall of reactions. Twenty-four moments in an endless stack — swipe through and find the one that lands.</p>
    </Reveal>
    {videos.length?<ReframeGallery home items={videos.map(asVideo)} kind="video" variant="objects" path="/video-templates"/>:
      <div className="rf-motion-teaser"><Clapperboard size={58}/><h3>The moving archive.</h3><p>Watch the moment, then make it yours.</p><Link href="/video-templates">Browse video formats <ArrowUpRight size={18}/></Link></div>}
    <div className="rf-section-end"><span>{videos.length + " MOVING FORMATS · THE FULL LOOP"}</span><Link href="/video-templates">Explore the motion archive <ArrowUpRight size={18}/></Link></div>
   </div>
  </section>
  <section className="rf-home-studio-banner"><div className="container rf-home-studio-grid">
   <Reveal><span className="rf-kicker">04 / YOUR CREATIVE CORNER</span><h2>Half-finished<br/>is still <em>something.</em></h2><p>Keep the jokes worth coming back to. Your drafts, saved formats and favourite finds, all in one personal space on this device.</p><Link href="/studio">Open your Studio <ArrowUpRight size={20}/></Link></Reveal>
   <Reveal className="rf-home-studio-graphic">
    <div className="rf-studio-sample" aria-hidden="true">
      <div className="rf-studio-sample-top"><span>MIM / YOUR SPACE</span><span>PRINTROOM NO. 004</span></div>
      <div className="rf-studio-sample-stage">
        <figure className="rf-studio-sample-card rf-studio-sample-back">
          <Image src="/templates/two-buttons.jpg" width={600} height={908} alt=""/>
          <figcaption>THE GOOD ONES / 002</figcaption>
        </figure>
        <figure className="rf-studio-sample-card rf-studio-sample-front">
          <Image src="/templates/drake.jpg" width={1200} height={1200} alt=""/>
          <figcaption>YOUR NEXT REACTION / 001</figcaption>
        </figure>
        <div className="rf-studio-sample-stamp">KEEP<br/>THIS.</div>
      </div>
      <div className="rf-studio-sample-foot"><span>ONE PLACE FOR YOUR IDEAS</span><span>✳</span></div>
    </div>
   </Reveal>
  </div></section>
  <section className="rf-home-faq"><div className="container rf-home-faq-grid">
   <Reveal><span className="rf-kicker">05 / BEFORE YOU ASK</span><h2>The fine<br/><em>print.</em></h2><Link href="/faq">All the answers <ArrowUpRight size={17}/></Link></Reveal>
   <Reveal className="rf-home-questions">{questions.map((item,index)=><details key={item.q} open={index===0}><summary><span>{String(index+1).padStart(2,"0")}</span>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}</Reveal>
  </div></section>
  <section className="rf-home-maker"><div className="container rf-maker-grid">
   <div className="rf-maker-photo"><Image src="/raj-suhandani-portrait.webp" width={700} height={850} alt="Portrait of the Meme Is Mine creator"/></div>
   <Reveal><span className="rf-kicker">06 / ONE PERSON, TOO MANY TABS</span><h2>Made by a<br/><em>fellow internet person.</em></h2><p>Meme Is Mine is an independent project built for the little moments that need a better punchline. Less friction, more personality, and the freedom to make something your friends will actually send around.</p><Link href="/about">The story behind the site <ArrowUpRight size={18}/></Link></Reveal>
  </div></section>
  <section className="rf-home-last"><div className="container"><span className="rf-kicker">THE NEXT ONE IS YOURS</span><h2>Enough scrolling.<br/><em>Make the meme.</em></h2><Link href="/explore">Get started <ArrowUpRight size={23}/></Link></div></section>
  <SiteFooter/>
 </main>;
}
