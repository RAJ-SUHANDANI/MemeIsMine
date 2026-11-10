"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Clapperboard, Compass, House, ImagePlus, LayoutDashboard, Menu, Plus, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
function BrandLogo(){return <Link href="/" aria-label="Meme Is Mine home" className="rf-brand"><Image src="/meme-is-mine-logo.svg" alt="Meme Is Mine" width={174} height={44}/></Link>;}

const desktopLinks = [
  {href:"/explore",name:"Image templates"},
  {href:"/video-templates",name:"Video templates"},
  {href:"/studio",name:"Studio"},
];
const mobileLinks = [
  {href:"/",name:"Home",Icon:House},
  {href:"/explore",name:"Images",Icon:Compass},
  {href:"",name:"Create",Icon:Plus},
  {href:"/video-templates",name:"Videos",Icon:Clapperboard},
  {href:"/studio",name:"Studio",Icon:LayoutDashboard},
];

export function ReframeHeader() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [signedIn,setSignedIn] = useState(false);
  const [menu,setMenu] = useState(false);
  const [create,setCreate] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account",{signal:controller.signal}).then(r => r.ok ? r.json() : {signedIn:false})
      .then(data => setSignedIn(data.signedIn === true)).catch(() => undefined);
    return () => controller.abort();
  },[pathname]);
  useEffect(() => { setMenu(false); setCreate(false); },[pathname]);
  useEffect(() => {
    if(!create) return;
    const oldOverflow = document.body.style.overflow;
    const trigger = createTrigger.current;
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    function key(e:KeyboardEvent) {
      if(e.key === "Escape") setCreate(false);
      if(e.key !== "Tab" || !sheet.current) return;
      const controls = Array.from(sheet.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"));
      if(!controls.length) return;
      if(e.shiftKey && document.activeElement === controls[0]) {e.preventDefault();controls[controls.length-1].focus();}
      else if(!e.shiftKey && document.activeElement === controls[controls.length-1]) {e.preventDefault();controls[0].focus();}
    }
    window.addEventListener("keydown",key);
    return () => {document.body.style.overflow = oldOverflow;window.removeEventListener("keydown",key);trigger?.focus();};
  },[create]);
  return <>
    <header className="rf-header">
      <div className="rf-header-inner">
        <BrandLogo/>
        <nav className="rf-desktop-nav" aria-label="Primary navigation">
          {desktopLinks.map(link => <Link key={link.href} href={link.href} aria-current={pathname===link.href?"page":undefined} className={pathname===link.href?"is-current":""}>{link.name}</Link>)}
        </nav>
        <div className="rf-header-end">
          <Link href={signedIn?"/account":"/login"} className="rf-header-account"><UserRound size={17}/><span>{signedIn?"Account":"Sign in"}</span></Link>
          <Link href="/explore" className="rf-header-action">Find a format <ArrowUpRight size={16}/></Link>
          <button className="rf-menu-button" type="button" onClick={()=>setMenu(!menu)} aria-label={menu?"Close menu":"Open menu"} aria-expanded={menu}>{menu?<X size={22}/>:<Menu size={22}/>}</button>
        </div>
      </div>
      <AnimatePresence>
        {menu && <motion.nav aria-label="More navigation" className="rf-mobile-menu" initial={reduce?false:{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
          {[...desktopLinks,{href:"/how-it-works",name:"How it works"},{href:"/about",name:"About"},{href:"/faq",name:"FAQ"},{href:"/contact",name:"Contact"},{href:signedIn?"/account":"/login",name:signedIn?"Account":"Sign in"}].map(item=><Link key={item.href} href={item.href} onClick={()=>setMenu(false)}>{item.name}</Link>)}
        </motion.nav>}
      </AnimatePresence>
    </header>
    <nav className="rf-bottom-nav" aria-label="Mobile navigation">
      {mobileLinks.map(({href,name,Icon}) => href
        ? <Link href={href} key={name} aria-current={pathname===href?"page":undefined} className={pathname===href?"is-current":""}><Icon size={21}/><span>{name}</span></Link>
        : <button ref={createTrigger} type="button" key={name} onClick={()=>setCreate(true)} aria-label="Start creating"><span className="rf-create-button"><Icon size={23}/></span><span>Create</span></button>)}
    </nav>
    <AnimatePresence>
      {create && <>
        <motion.button type="button" className="rf-sheet-backdrop" aria-label="Close creation options" onClick={()=>setCreate(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/>
        <motion.div role="dialog" aria-modal="true" aria-label="Create a meme" className="rf-create-sheet" tabIndex={-1} ref={sheet} initial={reduce?false:{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:360,damping:35}}>
          <div className="rf-sheet-handle" aria-hidden="true"/>
          <header><div><span className="rf-kicker">START SOMETHING</span><h2>The joke is yours.</h2></div><button type="button" aria-label="Close" onClick={()=>setCreate(false)}><X size={20}/></button></header>
          <Link href="/create/upload"><ImagePlus size={22}/><span><strong>Use your image</strong><small>Start from your device</small></span><ArrowUpRight size={19}/></Link>
          <Link href="/templates"><Search size={22}/><span><strong>Find an image meme</strong><small>Browse image templates</small></span><ArrowUpRight size={19}/></Link>
          <Link href="/video-templates"><Clapperboard size={22}/><span><strong>Make a moving meme</strong><small>Find a video or GIF</small></span><ArrowUpRight size={19}/></Link>
        </motion.div>
      </>}
    </AnimatePresence>
  </>;
}
