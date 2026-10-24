"use client";
import Link from "next/link";
import { ArrowUpRight, Github, Globe2, Linkedin, Mail, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SiteHeader } from "@/components/site";
export default function ContactPage(){
 const reduce=useReducedMotion();
 const links=[
  {name:"Portfolio",detail:"More about me, projects, and experience",url:"https://rajsuhandani.vercel.app/",icon:Globe2,tag:"THE FULL PICTURE"},
  {name:"GitHub",detail:"Explore source code and other projects",url:"https://github.com/RAJ-SUHANDANI",icon:Github,tag:"CODE & EXPERIMENTS"},
  {name:"LinkedIn",detail:"Professional updates and connections",url:"https://www.linkedin.com/in/raj-suhandani-a4a393321",icon:Linkedin,tag:"LET’S CONNECT"},
  {name:"Email",detail:"Questions, ideas, and collaboration",url:"mailto:rajsuhandani11@gmail.com",icon:Mail,tag:"DIRECT LINE"},
 ];
 return <main className="paper-noise"><SiteHeader/><section className="page-hero"><div className="container"><span className="eyebrow">A good conversation can go places</span><h1>Say <span>hello.</span></h1><p>Questions about Meme Is Mine, a bug to report, or a cool idea? Here are the best ways to reach me.</p></div></section>
  <section className="section"><div className="container contact-layout"><motion.div className="contact-note" initial={reduce?false:{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:.5}}><div className="contact-burst"><MessageCircle size={34}/></div><span className="eyebrow">Made by Raj Suhandani</span><h2 className="page-display">LET’S MAKE<br/><em>GOOD THINGS.</em></h2><p>I’m Raj Suhandani, a web developer who enjoys thoughtful interfaces, useful products, playful interactions, and details that make digital experiences feel personal.</p><div className="contact-location"><span className="tiny-dot"/> WEB DEVELOPER <span>/</span> OPEN TO GOOD IDEAS</div></motion.div>
   <div className="contact-cards">{links.map((link,i)=><motion.a key={link.name} className="contact-card" href={link.url} target={link.name==="Email"?undefined:"_blank"} rel={link.name==="Email"?undefined:"noreferrer"} initial={reduce?false:{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.35,delay:i*.06}} whileHover={reduce?undefined:{x:6}}><link.icon size={23}/><div><small>{link.tag}</small><h3>{link.name}</h3><p>{link.detail}</p></div><ArrowUpRight size={19}/></motion.a>)}</div></div></section>
  <section className="section section-dark"><div className="container"><div className="contact-quote"><span className="eyebrow">One last thing</span><h2>THE BEST BUG REPORT<br/><em>INCLUDES THE STEPS.</em></h2><p>Tell me what you clicked, what you expected, and what happened instead. That makes it much easier to improve the experience.</p><a className="button button-red" href="mailto:rajsuhandani11@gmail.com?subject=Meme%20Is%20Mine%20feedback">Send feedback <ArrowUpRight size={15}/></a></div></div></section>
  <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Contact</div><div className="footer-links"><Link href="/about">About Raj</Link><Link href="/faq">FAQ</Link><Link href="/privacy">Privacy</Link></div><span className="footer-copy">Created by Raj Suhandani</span></div></footer></main>;
}
