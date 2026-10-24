"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bookmark, Clapperboard, FileImage, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
type Draft={id:string;templateId:string;name:string;url:string;topText:string;bottomText:string;fontSize?:number;outline?:boolean;updatedAt:string;source?:string};
type VideoDraft={id:string;templateId:string;name:string;url:string;mediaType:"gif"|"video";updatedAt:string};
type VideoTemplateInfo={id:string;name:string;url:string;posterUrl:string;mediaType:"gif"|"video"};
const DRAFTS_KEY="mim-drafts";const BOOKMARKS_KEY="mim-bookmarks";
export default function StudioPage(){
  const[drafts,setDrafts]=useState<Draft[]>([]);const[videoDrafts,setVideoDrafts]=useState<VideoDraft[]>([]);const[videoTemplates,setVideoTemplates]=useState<VideoTemplateInfo[]>([]);const[savedIds,setSavedIds]=useState<string[]>([]);const[memes,setMemes]=useState<MemeTemplate[]>(starterMemes);
  useEffect(()=>{
    try{setDrafts(JSON.parse(localStorage.getItem(DRAFTS_KEY)??"[]"))}catch{setDrafts([])}
    try{setVideoDrafts(JSON.parse(localStorage.getItem("mim-video-drafts")??"[]"))}catch{setVideoDrafts([])}
    try{setSavedIds(JSON.parse(localStorage.getItem(BOOKMARKS_KEY)??"[]"))}catch{setSavedIds([])}
    fetch("/api/memes?limit=100").then((res)=>res.json()).then((data)=>{if(data.success&&data.memes?.length)setMemes(data.memes)}).catch(()=>undefined);
    fetch("/api/video-templates?limit=100&sort=popular").then((res)=>res.json()).then((data)=>{if(data.success&&Array.isArray(data.templates))setVideoTemplates(data.templates)}).catch(()=>undefined);
    const refresh=()=>{try{setSavedIds(JSON.parse(localStorage.getItem(BOOKMARKS_KEY)??"[]"))}catch{setSavedIds([])}};
    window.addEventListener("mim-bookmarks-updated",refresh);window.addEventListener("storage",refresh);
    return()=>{window.removeEventListener("mim-bookmarks-updated",refresh);window.removeEventListener("storage",refresh)};
  },[]);
  function deleteDraft(id:string){const next=drafts.filter((draft)=>draft.id!==id);setDrafts(next);localStorage.setItem(DRAFTS_KEY,JSON.stringify(next))}
  const savedMemes=memes.filter((meme)=>savedIds.includes(meme.id));
  const savedVideoIds=savedIds.filter((id)=>id.startsWith("video:")).map((id)=>id.slice(6));
  const savedVideos=videoTemplates.filter((template)=>savedVideoIds.includes(template.id));
  return <main className="paper-noise"><SiteHeader/>
    <section className="page-hero"><div className="container studio-header"><div><span className="eyebrow">Your space on this device</span><h1>Your <span>studio.</span></h1><p>Drafts and saved formats, ready when the next idea hits.</p></div><Link href="/explore" className="button button-dark">Find another format <ArrowUpRight size={15}/></Link></div></section>
    <section className="section" style={{paddingTop:44}}><div className="container">
      <div className="section-head"><div><span className="eyebrow">01 / In progress</span><h2 className="section-title" style={{fontSize:46}}>Your drafts</h2></div><p className="section-note">Saved in local storage on this browser. No account, no remote database.</p></div>
      {drafts.length?<div className="template-grid">{drafts.map((draft)=><article className="draft-card" key={draft.id}><div className="draft-preview">{draft.url?<img src={draft.url} alt={draft.name}/>:<div className="canvas-placeholder"><FileImage size={25}/><span>Text draft</span></div>}</div><h3 className="draft-title">{draft.name}</h3><p className="draft-date">Saved {new Date(draft.updatedAt).toLocaleString()}</p><p className="control-help">{draft.topText} / {draft.bottomText}</p><div className="draft-actions"><Link href={`/create/${draft.templateId}?draft=${encodeURIComponent(draft.id)}${draft.source === "indian" ? "&source=indian" : ""}`} className="button button-dark button-small">Continue <ArrowUpRight size={13}/></Link><button className="button button-paper button-small" onClick={()=>deleteDraft(draft.id)} aria-label="Delete draft"><Trash2 size={14}/></button></div></article>)}</div>:<div className="empty-state"><FileImage size={29}/><h2>Nothing in the works. Yet.</h2><p>Make a meme, then save the draft to pick up where you left off.</p><Link href="/explore" className="button button-dark button-small" style={{marginTop:13}}>Find a template <ArrowUpRight size={14}/></Link></div>}
    </div></section>
    <section className="section" style={{paddingTop:10}}><div className="container">
      <div className="section-head"><div><span className="eyebrow">02 / Saved for later</span><h2 className="section-title" style={{fontSize:46}}>Your bookmarks</h2></div><p className="section-note">Keep your favourite formats close. They stay on this device.</p></div>
      {savedMemes.length?<div className="template-grid">{savedMemes.map((meme)=><article key={meme.id}><div className="draft-preview" style={{marginBottom:8}}><img src={meme.url} alt={meme.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><p className="draft-title">{meme.name}</p><Link href={`/create/${meme.id}`} className="text-link">Use this format <ArrowUpRight size={13}/></Link></article>)}</div>:<div className="empty-state"><Bookmark size={28}/><h2>Save the good ones.</h2><p>Tap the bookmark on any template and it’ll show up here.</p><Link href="/explore" className="text-link" style={{marginTop:12}}>Explore templates <ArrowUpRight size={14}/></Link></div>}
    </div></section>
    <section className="section" style={{paddingTop:10}}><div className="container">
      <div className="section-head"><div><span className="eyebrow">03 / Video work in progress</span><h2 className="section-title" style={{fontSize:46}}>Video drafts</h2></div><p className="section-note">Video editor settings and layers are saved locally in this browser.</p></div>
      {videoDrafts.length?<div className="template-grid">{videoDrafts.map((draft)=><article className="draft-card" key={draft.id}><div className="draft-preview">{draft.url?<img src={draft.url} alt={draft.name}/>:<div className="canvas-placeholder"><Clapperboard size={25}/><span>Video draft</span></div>}</div><h3 className="draft-title">{draft.name}</h3><p className="draft-date">Saved {new Date(draft.updatedAt).toLocaleString()}</p><div className="draft-actions"><Link href={"/video-editor/"+encodeURIComponent(draft.templateId)+"?draft="+encodeURIComponent(draft.id)} className="button button-dark button-small">Continue <ArrowUpRight size={13}/></Link><button className="button button-paper button-small" onClick={()=>{const next=videoDrafts.filter((item)=>item.id!==draft.id);setVideoDrafts(next);localStorage.setItem("mim-video-drafts",JSON.stringify(next));}} aria-label="Delete video draft"><Trash2 size={14}/></button></div></article>)}</div>:<div className="empty-state"><Clapperboard size={28}/><h2>Your video ideas belong here.</h2><p>Open a video template, add captions or overlays, and choose Save to studio.</p><Link href="/video-templates" className="button button-dark button-small" style={{marginTop:13}}>Browse video templates <ArrowUpRight size={14}/></Link></div>}
    </div></section>
    <section className="section" style={{paddingTop:10}}><div className="container">
      <div className="section-head"><div><span className="eyebrow">04 / Saved motion formats</span><h2 className="section-title" style={{fontSize:46}}>Video bookmarks</h2></div><p className="section-note">Your bookmarked video templates stay on this device.</p></div>
      {savedVideoIds.length?<div className="template-grid">{savedVideoIds.map((id)=>{const template=videoTemplates.find((item)=>item.id===id);return <article key={id} className="draft-card"><div className="draft-preview">{template?.posterUrl?<img src={template.posterUrl} alt={template.name}/>:<Clapperboard size={28}/>}</div><h3 className="draft-title">{template?.name??id}</h3><div className="draft-actions"><Link href={"/video-editor/"+encodeURIComponent(id)} className="button button-dark button-small">Use template <ArrowUpRight size={13}/></Link><button className="button button-paper button-small" onClick={()=>{const next=savedIds.filter((item)=>item!=="video:"+id);setSavedIds(next);localStorage.setItem(BOOKMARKS_KEY,JSON.stringify(next));window.dispatchEvent(new Event("mim-bookmarks-updated"));}} aria-label="Remove video bookmark"><Trash2 size={14}/></button></div></article>})}</div>:<p className="control-help">Bookmark a video template to find it here.</p>}
    </div></section>
    <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Studio</div><div className="footer-links"><Link href="/">Home</Link><Link href="/explore">Explore templates</Link></div><span className="footer-copy">Private by default. Stored locally.</span></div></footer>
  </main>;
}
