"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Code2, Github, Globe2, Linkedin, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site";
export default function AboutPage(){
 const reduce=useReducedMotion();
 return <main className="paper-noise"><SiteHeader/>
  <section className="page-hero"><div className="container"><span className="eyebrow">The person behind the punchline</span><h1>Made with a little<br/><span>curiosity.</span></h1><p>Meme Is Mine is an independent project built by someone who believes the internet should be fun to make things for.</p></div></section>
  <section className="section about-main"><div className="container about-grid">
    <motion.div className="about-portrait-frame" initial={reduce?false:{opacity:0,y:24,rotate:-2}} animate={{opacity:1,y:0,rotate:0}} transition={{duration:.65,ease:[.2,.8,.2,1]}} whileHover={reduce?undefined:{rotate:1.2,y:-5}}>
      <div className="portrait-topline"><span>CREATOR / 001</span><span>BHAVNAGAR, IN</span></div>
      <img src="/raj-suhandani-portrait.webp" alt="Raj Manish Suhandani, creator of Meme Is Mine" width="800" height="1000" />
      <div className="portrait-signature"><div><small>MADE BY</small><strong>Raj Suhandani<span>.</span></strong></div><span className="portrait-star">✳</span></div>
    </motion.div>
    <motion.div className="about-copy" initial={reduce?false:{opacity:0,x:24}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.2}} transition={{duration:.6}}>
      <span className="eyebrow">Hey, I’m Raj</span>
      <h2 className="page-display">I LIKE BUILDING<br/>THINGS THAT<br/><em>FEEL ALIVE.</em></h2>
      <p className="about-intro">I’m <strong>Raj Manish Suhandani</strong>, an Information and Communication Technology engineering student based in Bhavnagar, Gujarat.</p>
      <p>I’m interested in the space where software engineering meets thoughtful product design: strong frontend experiences, useful full-stack systems, creative coding, and small details that make a digital product feel cared for.</p>
      <p>Meme Is Mine is my take on a meme-making studio that feels like an internet culture brand—not just another utility page. I wanted the experience to be playful, expressive, and genuinely useful, from finding a format to downloading the final meme.</p>
      <p className="about-muted">Outside this project, I build independent web apps, explore interactive interfaces, and work with technologies including React, Next.js, TypeScript, and motion/3D tools. I’ve also worked on content planning and brand communication.</p>
      <div className="about-actions"><a className="button button-dark" href="https://rajsuhandani.vercel.app/" target="_blank" rel="noreferrer">Visit my portfolio <ArrowUpRight size={16}/></a><a className="text-link" href="https://github.com/RAJ-SUHANDANI" target="_blank" rel="noreferrer">Explore my GitHub <Github size={15}/></a></div>
    </motion.div>
  </div></section>
  <section className="section section-dark"><div className="container"><div className="section-head"><div><span className="eyebrow">A few things I care about</span><h2 className="section-title">GOOD IDEAS<br/><span className="serif-italic">DESERVE GOOD EXECUTION.</span></h2></div><p className="section-note" style={{color:"#c4bcb0"}}>The small decisions add up: clear interactions, careful motion, accessible controls, and a product that respects people’s time.</p></div>
    <div className="about-principles"><article><Code2/><small>01 / CRAFT</small><h3>Built to work.</h3><p>Interactions should do what they promise, not just look clickable.</p></article><article><Sparkles/><small>02 / PERSONALITY</small><h3>Built to feel.</h3><p>A little playfulness can make a useful product memorable.</p></article><article><Globe2/><small>03 / ACCESS</small><h3>Built for people.</h3><p>Responsive layouts, reduced-motion options, and no forced signup for a quick meme.</p></article></div>
  </div></section>
  <section className="section"><div className="container about-credit"><div><span className="eyebrow">Independent project / 2026</span><h2 className="page-display">THE INTERNET<br/>IS YOUR CANVAS.</h2><p>Meme Is Mine is designed and developed by Raj Suhandani as an independent creative web project.</p><div className="about-socials"><a href="https://www.linkedin.com/in/raj-suhandani-a4a393321" target="_blank" rel="noreferrer" aria-label="Raj's LinkedIn"><Linkedin/></a><a href="https://github.com/RAJ-SUHANDANI" target="_blank" rel="noreferrer" aria-label="Raj's GitHub"><Github/></a><a href="https://rajsuhandani.vercel.app/" target="_blank" rel="noreferrer" aria-label="Raj's portfolio"><Globe2/></a></div></div><motion.div className="about-end-stamp" animate={reduce?undefined:{rotate:[-8,3,-8],y:[0,-7,0]}} transition={{duration:7,repeat:Infinity,ease:"easeInOut"}}><span>MADE BY</span><strong>RAJ<br/>SUHANDANI<span>.</span></strong><small>WITH INTENT, NOT A TEMPLATE.</small></motion.div></div></section>
  <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · An independent project</div><div className="footer-links"><Link href="/">Home</Link><Link href="/explore">Explore</Link><Link href="/contact">Contact</Link></div><span className="footer-copy">Created by Raj Suhandani</span></div></footer>
 </main>;
}
