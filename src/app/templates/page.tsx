"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, MessageCircle, BriefcaseBusiness, Cat, Brain, Heart, Flame, ImagePlus } from "lucide-react";
import { SiteHeader } from "@/components/site";
const groups=[
 {name:"Classics",tag:"THE TIMELESS ONES",copy:"Formats that have lived through a thousand group chats and somehow still work.",icon:Flame,count:"EVERGREEN",href:"/explore?category=Classics",className:"template-feature red"},
 {name:"Reaction images",tag:"SAY IT WITHOUT SAYING IT",copy:"The exact facial expression for when words are not doing the job.",icon:MessageCircle,count:"INSTANT CONTEXT",href:"/explore?category=Reaction",className:"template-feature ink"},
 {name:"Relatable",tag:"SUSPICIOUSLY SPECIFIC",copy:"For missed deadlines, bad decisions, tiny wins, and being a person online.",icon:Heart,count:"VERY YOU",href:"/explore?category=Relatable",className:"template-feature paper"},
 {name:"Animals",tag:"CREATURES WITH RANGE",copy:"Cats, dogs, and other expressive icons of the internet.",icon:Cat,count:"PURE EXPRESSION",href:"/explore?category=Animals",className:"template-feature green"},
 {name:"Absurd",tag:"LOGIC HAS LEFT THE CHAT",copy:"For thoughts that took a strange turn and refuse to come back.",icon:Brain,count:"UNHINGED",href:"/explore?category=Absurd",className:"template-feature lilac"},
 {name:"Work & study",tag:"PROFESSIONALLY DISTRACTED",copy:"Meetings, deadlines, studying, and pretending the tab is work.",icon:BriefcaseBusiness,count:"OFFICE FUEL",href:"/explore?category=Work",className:"template-feature ink"},
];
export default function TemplatesPage(){
 const reduce=useReducedMotion();
 return <main className="paper-noise"><SiteHeader/>
  <section className="page-hero"><div className="container"><span className="eyebrow">A format for every flavour of chaos</span><h1>The meme <span>index.</span></h1><p>Browse by mood, situation, or the exact energy you’re trying to communicate.</p></div></section>
  <section className="section"><div className="container"><div className="section-head"><div><span className="eyebrow">Pick your lane</span><h2 className="section-title">WHAT’S THE<br/><span className="serif-italic">SITUATION?</span></h2></div><p className="section-note">Choose a collection to open the library with a useful starting point.</p></div>
   <div className="template-category-grid">{groups.map((group,i)=><motion.article key={group.name} className={group.className} initial={reduce?false:{opacity:0,y:18,rotate:i%2?1:-1}} whileInView={{opacity:1,y:0,rotate:0}} whileHover={reduce?undefined:{y:-7,rotate:i%2?1.5:-1.5}} viewport={{once:true,amount:.1}} transition={{duration:.4,delay:i*.04}}><Link href={group.href}><div className="template-feature-head"><span>{group.tag}</span><group.icon size={23}/></div><h3>{group.name}<span>.</span></h3><p>{group.copy}</p><div className="template-feature-foot"><small>{group.count}</small><span className="feature-go"><ArrowUpRight size={18}/></span></div></Link></motion.article>)}</div>
  </div></section>
  <section className="section section-dark"><div className="container"><div className="section-head"><div><span className="eyebrow">No template? No problem.</span><h2 className="section-title">BRING YOUR<br/><span className="serif-italic">OWN MATERIAL.</span></h2></div><p className="section-note" style={{color:"#c4bcb0"}}>Start from a photo or image on your device and put the joke exactly where you want it.</p></div><Link href="/create/upload" className="button button-red">Upload an image <ImagePlus size={16}/></Link></div></section>
  <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Template index</div><div className="footer-links"><Link href="/explore">Explore all</Link><Link href="/how-it-works">How it works</Link><Link href="/faq">FAQ</Link></div><span className="footer-copy">Created by Raj Suhandani</span></div></footer>
 </main>;
}
