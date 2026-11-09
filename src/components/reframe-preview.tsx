/* Native image/video files are preserved in previews. */
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Bookmark, Check, Copy, Heart, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTemplateLikes } from "./use-template-likes";
import { ZoomablePreview } from "./zoomable-preview";

export type ReframeItem = {
  id:string; name:string; image:string; kind:"image"|"video"; category:string;
  editorHref:string; likeId?:string; mediaUrl?:string; mediaType?:"gif"|"video"; sourceHref?:string;
};

export function ReframePreview({item,onClose,saved,onSave,galleryPath}:{
  item:ReframeItem;onClose:()=>void;saved:boolean;onSave:()=>void;galleryPath:string;
}) {
  const titleId = useId();
  const path = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const likes = useTemplateLikes(item.kind + ":" + (item.likeId ?? item.id));
  const [copied,setCopied] = useState(false);
  const [copyError,setCopyError] = useState(false);
  const [guestHint,setGuestHint] = useState(false);
  const [mediaError,setMediaError] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function keydown(e:KeyboardEvent) {
      if (e.key==="Escape") {e.preventDefault();onClose();}
      if(e.key!=="Tab" || !panel.current) return;
      const controls = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]"));
      if(!controls.length) return;
      if(e.shiftKey && document.activeElement===controls[0]) {e.preventDefault();controls[controls.length-1].focus();}
      else if(!e.shiftKey && document.activeElement===controls[controls.length-1]) {e.preventDefault();controls[0].focus();}
    }
    window.addEventListener("keydown",keydown);
    return () => { document.body.style.overflow=oldOverflow;window.removeEventListener("keydown",keydown);previous?.focus(); };
  },[onClose]);
  function doubleTap() {
    if (!likes.state?.signedIn) {setGuestHint(true);return false;}
    void likes.react(true);
    return true;
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + galleryPath + "?preview=" + encodeURIComponent(item.id));
      setCopied(true);setCopyError(false);
      window.setTimeout(()=>setCopied(false),2200);
    } catch {setCopyError(true);}
  }
  const videoSrc = item.mediaUrl ? "/api/video-source?url=" + encodeURIComponent(item.mediaUrl) + (item.sourceHref ? "&referrer=" + encodeURIComponent(item.sourceHref) : "") : "";
  return <motion.div className="rf-preview-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button type="button" className="rf-preview-scrim" aria-label="Close preview" onClick={onClose}/>
    <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="rf-preview-panel"
      initial={reduced?false:{opacity:0,y:24,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={reduced?{opacity:0}:{opacity:0,y:18,scale:.98}}
      transition={{type:"spring",stiffness:330,damping:35}}>
      <div className="rf-preview-top"><span className="rf-kicker">FORMAT / {item.kind==="image"?"STILL":"MOTION"} / {item.category}</span><button type="button" className="rf-round-icon" onClick={onClose} aria-label="Close preview"><X size={20}/></button></div>
      <div className="rf-preview-grid">
        <motion.div className="rf-preview-art" layoutId={"rf-art-" + item.kind + "-" + item.id} transition={{type:"spring",stiffness:330,damping:35}}>
          {item.kind==="image" ? <ZoomablePreview onDoubleTap={doubleTap}><img src={item.image} alt={item.name}/></ZoomablePreview> :
            mediaError || !videoSrc ?
              <div className="rf-media-fallback"><img src={item.image} alt=""/><p role="status">This clip is unavailable right now. Try another format.</p></div> :
              item.mediaType==="gif" ?
                <img src={videoSrc} className="rf-gif" alt={item.name} onError={()=>setMediaError(true)}/> :
                <video src={videoSrc} poster={item.image||undefined} controls playsInline preload="metadata" aria-label={item.name} onError={()=>setMediaError(true)}/>}
        </motion.div>
        <div className="rf-preview-copy">
          <div><span className="rf-kicker">YOUR NEXT FORMAT</span><h2 id={titleId}>{item.name}</h2><p>{item.kind==="video"?"A moving moment, waiting for your caption.":"A familiar image. Your entirely new punchline."}</p></div>
          <div className="rf-preview-actions-row" role="group" aria-label="Template actions">
            {likes.state?.signedIn ?
              <button type="button" disabled={likes.busy} aria-pressed={likes.liked} onClick={()=>void likes.react(!likes.liked)}>
                <Heart size={21} fill={likes.liked?"currentColor":"none"}/><span>{likes.count===null?"Like":new Intl.NumberFormat("en-IN").format(likes.count)}</span>
              </button> :
              <Link href={"/login?next="+encodeURIComponent(path)}><Heart size={21}/><span>Like</span></Link>}
            <button type="button" aria-pressed={saved} onClick={onSave}><Bookmark size={21} fill={saved?"currentColor":"none"}/><span>{saved?"Saved":"Save"}</span></button>
            <button type="button" onClick={()=>void copyLink()}>
              <AnimatePresence initial={false} mode="wait">{copied ?
                <motion.span key="check" initial={{opacity:0,scale:.6}} animate={{opacity:1,scale:1}} exit={{opacity:0}}><Check size={21}/></motion.span> :
                <motion.span key="copy" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Copy size={21}/></motion.span>}</AnimatePresence>
              <span>{copied?"Copied":"Copy"}</span>
            </button>
          </div>
          {copyError && <p className="rf-error" role="alert">Clipboard permission unavailable. Please try again.</p>}
          {guestHint && <p className="rf-error" role="status">Sign in to like this template.</p>}
          {likes.failed && <p className="rf-error" role="status">Likes are temporarily unavailable.</p>}
          <p className="rf-gesture-note">{item.kind==="image"?"Pinch to zoom. Double-tap to like.":"Video starts when you press play."}</p>
          <div className="rf-preview-links"><Link href={item.editorHref} className="rf-primary-action">Use this template <ArrowUpRight size={19}/></Link>
            {item.sourceHref && <a href={item.sourceHref} target="_blank" rel="noopener noreferrer">View original source <ArrowUpRight size={15}/></a>}
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>;
}
