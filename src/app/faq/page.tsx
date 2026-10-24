"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SiteHeader } from "@/components/site";
const questions=[
 {q:"Is Meme Is Mine free to use?",a:"Yes. The current experience is free to use. Browse templates, create a meme, and export a PNG without creating an account."},
 {q:"Do I need to sign up or verify my email?",a:"No. There is no account or email verification step in this version. The Studio uses local browser storage, so drafts are only available in the same browser profile and device."},
 {q:"Can I upload my own image?",a:"Yes. Open Create from your image or choose Upload image in the editor. JPG, PNG, and WebP images are supported, with a current size limit of 2.5 MB so uploads can be kept locally in your browser."},
 {q:"How do I download the meme?",a:"Use Download PNG in the editor. The app draws the selected image and your captions to a canvas in the browser and exports a square 1080 × 1080 PNG."},
 {q:"Where are saved drafts stored?",a:"Drafts and bookmarks are stored in localStorage in your browser. They are not uploaded to a database, do not sync across devices, and may be removed if you clear browser site data."},
 {q:"Why does a template image sometimes fail to load?",a:"The template library uses publicly available remote image URLs when the upstream feed is reachable. Availability can change if a remote image is moved or removed. You can upload an image you have permission to use instead."},
 {q:"Can I use a downloaded meme anywhere?",a:"That depends on the image and its rights. Only upload or use images you have permission to edit and share, and check any applicable rights or terms before using a meme commercially."},
 {q:"Does the editor work on mobile?",a:"The pages are responsive and you can browse and create on mobile. The editor layout stacks its tool and settings panels around the canvas on smaller screens."},
 {q:"Does the site use AI to write memes?",a:"No AI writing feature is part of this version. You choose the format and write your own captions."},
];
export default function FAQPage(){
 const [open,setOpen]=useState<number|null>(0);
 return <main className="paper-noise"><SiteHeader/><section className="page-hero"><div className="container"><span className="eyebrow">The obvious questions</span><h1>Good to <span>know.</span></h1><p>Everything you need to know before you make the group chat’s day.</p></div></section>
  <section className="section"><div className="container faq-layout"><div className="faq-intro"><span className="eyebrow">FAQ / 001</span><h2 className="page-display">NO MYSTERY.<br/><em>JUST MEMES.</em></h2><p>If something isn’t answered here, send a note and tell us what you’re trying to do.</p><Link href="/contact" className="button button-dark">Get in touch <ArrowUpRight size={15}/></Link></div>
  <div className="faq-list">{questions.map((item,index)=><div className={open===index?"faq-item is-open":"faq-item"} key={item.q}><button type="button" className="faq-question" aria-expanded={open===index} onClick={()=>setOpen(open===index?null:index)}><span><small>{String(index+1).padStart(2,"0")}</small>{item.q}</span><ChevronDown size={19}/></button><AnimatePresence initial={false}>{open===index&&<motion.div className="faq-answer" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.22}}><p>{item.a}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>
  <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · FAQ</div><div className="footer-links"><Link href="/about">About the creator</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></div><span className="footer-copy">Created by Raj Suhandani</span></div></footer></main>;
}
