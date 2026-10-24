"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Bookmark, Menu, X } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { MemeTemplate } from "@/data/memes";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-lockup" aria-label="Meme Is Mine home"><span className="brand-mark-wrap"><img src="/mim-mark.svg" alt="" className="brand-mark"/></span>{!compact && <span className="brand-wordmark">Meme Is <em>Mine</em><i>.</i></span>}</Link>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [{ href: "/explore", label: "Explore memes" }, { href: "/studio", label: "Your studio" }];
  return <header className="site-header"><div className="header-inner">
    <BrandLogo/>
    <nav className="desktop-nav" aria-label="Main navigation">{links.map((link) => <Link key={link.href} href={link.href} className={pathname === link.href ? "nav-link active" : "nav-link"}>{link.label}</Link>)}<a href="/#how-it-works" className="nav-link">How it works</a></nav>
    <div className="header-actions"><Link className="header-quiet" href="/studio">My drafts</Link><Link className="button button-dark header-cta" href="/explore">Make a meme <ArrowUpRight size={15}/></Link></div>
    <button className="mobile-menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X/> : <Menu/>}</button>
  </div>{open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}<a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a><Link href="/create/upload" onClick={() => setOpen(false)}>Upload your own</Link></nav>}</header>;
}

const BOOKMARKS_KEY = "mim-bookmarks";
export function MemeCard({ meme, index = 0 }: { meme: MemeTemplate; index?: number }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { const ids: string[] = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]"); setSaved(ids.includes(meme.id)); } catch { /* Ignore malformed local data. */ } }, [meme.id]);
  function toggleSaved(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault(); event.stopPropagation();
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]");
      const next = ids.includes(meme.id) ? ids.filter((id) => id !== meme.id) : [...ids, meme.id];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next)); setSaved(next.includes(meme.id));
      window.dispatchEvent(new Event("mim-bookmarks-updated"));
    } catch { setSaved((value) => !value); }
  }
  return <motion.article className="meme-card" initial={{ opacity: 0, y: 18, rotate: index % 2 ? 1.2 : -1.2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .42, delay: Math.min(index % 5, 4) * .045, ease: [.22, 1, .36, 1] }} whileHover={{ y: -7, rotate: index % 2 ? 1.5 : -1.5, scale: 1.015 }}>
    <Link href={`/create/${meme.id}`} className="meme-card-link" aria-label={`Make a meme with ${meme.name}`}>
      <div className="meme-card-image"><img src={meme.url} alt={meme.name} loading={index < 4 ? "eager" : "lazy"}/><span className="card-open"><ArrowUpRight size={15}/></span></div>
      <div className="meme-card-meta"><div><p className="meme-card-name">{meme.name}</p><span className="meme-card-category">{meme.category ?? "Meme format"}</span></div><button className={saved ? "save-button is-saved" : "save-button"} type="button" onClick={toggleSaved} aria-label={saved ? "Remove from saved templates" : "Save template"} aria-pressed={saved}><Bookmark size={17} fill={saved ? "currentColor" : "none"} strokeWidth={1.8}/></button></div>
    </Link>
  </motion.article>;
}

const floatingCards = [
  { name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg", className: "float-card float-card-one", caption: "ME / ONE MORE TAB", tilt: -8 },
  { name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg", className: "float-card float-card-two", caption: "THE CHOICE IS YOURS", tilt: 7 },
  { name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg", className: "float-card float-card-three", caption: "ABSOLUTELY NOT", tilt: 4 },
  { name: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg", className: "float-card float-card-four", caption: "HEAR ME OUT", tilt: -4 },
];

export function FloatingGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [0, 95]);
  return <div className="floating-gallery" ref={ref} aria-label="A floating collage of meme templates">
    <div className="gallery-orbit orbit-one"/><div className="gallery-orbit orbit-two"/>
    <motion.div className="gallery-stamp" style={reduce ? undefined : { y: drift, rotate: 10 }}><span>YOUR MEME.</span><strong>YOUR RULES.</strong><i>✳</i></motion.div>
    {floatingCards.map((card, index) => <motion.div key={card.name} className={card.className} initial={{ opacity: 0, y: 32, rotate: card.tilt * 1.8 }} animate={{ opacity: 1, y: reduce ? 0 : [0, index % 2 ? -11 : 9, 0], rotate: card.tilt }} transition={{ opacity: { duration: .8, delay: .16 + index * .12 }, y: { duration: 5.5 + index * .65, repeat: reduce ? 0 : Infinity, ease: "easeInOut", delay: index * .12 }, rotate: { duration: .8, delay: .16 + index * .12 } }} whileHover={reduce ? undefined : { scale: 1.045, rotate: 0, z: 50, transition: { duration: .22 } }}>
      <div className="float-card-top"><span className="tiny-dot"/><span>FORMAT NO. 0{index + 1}</span></div><div className="float-image"><img src={card.url} alt={card.name}/></div><div className="float-caption"><span>{card.caption}</span><b>↗</b></div>
    </motion.div>)}
    <div className="gallery-marker marker-left">GOOD MEMES<br/>BETTER TIMING</div><div className="gallery-marker marker-right">MADE FOR<br/>THE GROUP CHAT</div>
  </div>;
}
