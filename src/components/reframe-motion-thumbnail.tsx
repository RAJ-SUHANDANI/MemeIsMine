"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { ReframeItem } from "./reframe-preview";

/**
 * Only load a video while its card is onscreen. A page can show 72 seamless
 * rail clones; loading every video at once would saturate mobile connections.
 * All motion is muted, looped, playsInline, and has no playback UI.
 */
export function ReframeMotionThumbnail({item,loading="lazy"}:{
  item:ReframeItem;loading?:"eager"|"lazy";
}){
  const holder=useRef<HTMLDivElement>(null);
  const media=useRef<HTMLVideoElement>(null);
  const reduce=useReducedMotion();
  const [visible,setVisible]=useState(false);
  const [failed,setFailed]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    const element=holder.current;
    if(!element)return;
    const root=element.closest(".rf-rail-viewport");
    const observer=new IntersectionObserver(([entry])=>{
      setVisible(entry.isIntersecting && document.visibilityState==="visible");
    },{root,threshold:.4,rootMargin:"80px"});
    const onVisibility=()=>{if(document.hidden){setVisible(false);}else observer.unobserve(element),observer.observe(element);};
    observer.observe(element);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{observer.disconnect();document.removeEventListener("visibilitychange",onVisibility);};
  },[]);
  useEffect(()=>{
    if(!media.current)return;
    if(visible&&!reduce)void media.current.play().catch(()=>{});
    else media.current.pause();
  },[visible,reduce]);
  const proxy=item.mediaUrl?
    "/api/video-source?url="+encodeURIComponent(item.mediaUrl)+(item.sourceHref?"&referrer="+encodeURIComponent(item.sourceHref):""):"";
  const animate=visible&&!reduce&&!failed&&Boolean(proxy);
  return <div ref={holder} className="rf-motion-thumbnail">
    {item.image?<img src={item.image} alt="" loading={loading} decoding="async" className="rf-motion-thumbnail-poster"/>:
      <span className="rf-poster-placeholder" aria-hidden="true">MIM / MOTION</span>}
    {animate&&(item.mediaType==="gif"?
       <img src={proxy} alt="" className="rf-motion-thumbnail-live" onError={()=>setFailed(true)}/>:
       <video ref={media} src={proxy} muted autoPlay loop playsInline preload="metadata"
          aria-hidden="true" className={"rf-motion-thumbnail-live"+(ready?" is-ready":"")}
          onLoadedData={()=>setReady(true)} onError={()=>setFailed(true)}/>)}
  </div>;
}
