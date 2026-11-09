"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Bookmark, Check, Clapperboard, FileImage, Folder, HardDriveDownload, HardDriveUpload, Heart, LayoutDashboard, Pencil, Plus, Search, SlidersHorizontal, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { starterMemes, type MemeTemplate } from "@/data/memes";
import { SiteHeader } from "./site";
import { SiteFooter } from "./site-chrome";

type Draft={id:string;templateId:string;name:string;url?:string;updatedAt?:string;source?:string;[key:string]:unknown};
type Collection={id:string;name:string;keys:string[]};
type StoredVideo={id:string;name:string;posterUrl?:string};
type Undo={key:"mim-drafts"|"mim-video-drafts";draft:Draft};
type Tab="overview"|"drafts"|"saved"|"liked"|"collections"|"backup";
type LikedItem={key:string;id:string;kind:"image"|"video";name:string;image:string;editorHref:string};
const draftKeys=["mim-drafts","mim-video-drafts"] as const;
const backupKeys=["mim-drafts","mim-video-drafts","mim-bookmarks","mim-bookmark-templates","mim-studio-collections"] as const;
const sections:{id:Tab;name:string;Icon:typeof LayoutDashboard}[]=[
 {id:"overview",name:"Overview",Icon:LayoutDashboard},
 {id:"drafts",name:"Drafts",Icon:FileImage},
 {id:"saved",name:"Saved formats",Icon:Bookmark},
 {id:"liked",name:"Liked",Icon:Heart},
 {id:"collections",name:"Collections",Icon:Folder},
 {id:"backup",name:"Backup & restore",Icon:HardDriveDownload}
];
function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
function validDraft(value:unknown):value is Draft{return isRecord(value)&&typeof value.id==="string"&&typeof value.templateId==="string"&&typeof value.name==="string"&&value.id.length<=200&&value.templateId.length<=200;}
function validCollection(value:unknown):value is Collection{return isRecord(value)&&typeof value.id==="string"&&typeof value.name==="string"&&Array.isArray(value.keys)&&value.keys.every(key=>typeof key==="string");}
function read<T>(key:string,valid:(value:unknown)=>value is T):T[]{
 try{const raw:unknown=JSON.parse(localStorage.getItem(key)??"[]");return Array.isArray(raw)?raw.filter(valid):[];}catch{return [];}
}
const isString=(value:unknown):value is string=>typeof value==="string";
const isImageTemplate=(value:unknown):value is MemeTemplate=>isRecord(value)&&typeof value.id==="string"&&typeof value.name==="string"&&typeof value.url==="string";
function safeImage(url:unknown){
 if(typeof url!=="string")return "";
 if(url.startsWith("data:image/png;base64,")||url.startsWith("data:image/jpeg;base64,")||url.startsWith("data:image/webp;base64,")||url.startsWith("/"))return url;
 try{const parsed=new URL(url);return parsed.protocol==="https:"?url:"";}catch{return "";}
}
function displayDate(date:unknown){
 if(typeof date!=="string")return "Saved on this device";
 const value=new Date(date);return Number.isNaN(value.getTime())?"Saved on this device":new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(value);
}
function countLabel(count:number,name:string){return count+" "+name+(count===1?"":"s");}

export function ReframeStudio(){
 const reduced=useReducedMotion();
 const [tab,setTab]=useState<Tab>("overview");
 const [drafts,setDrafts]=useState<Draft[]>([]);
 const [videoDrafts,setVideoDrafts]=useState<Draft[]>([]);
 const [savedIds,setSavedIds]=useState<string[]>([]);
 const [metadata,setMetadata]=useState<MemeTemplate[]>([]);
 const [videos,setVideos]=useState<StoredVideo[]>([]);
 const [collections,setCollections]=useState<Collection[]>([]);
 const [likedItems,setLikedItems]=useState<LikedItem[]>([]);
 const [likesError,setLikesError]=useState("");
 const [likesLoading,setLikesLoading]=useState(true);
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState("recent");
 const [newCollection,setNewCollection]=useState("");
 const [editing,setEditing]=useState("");
 const [draftName,setDraftName]=useState("");
 const [notice,setNotice]=useState("");
 const [undo,setUndo]=useState<Undo|null>(null);
 const [busy,setBusy]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 const allDrafts=useMemo(()=>[...drafts.map(d=>({...d,type:"image" as const})),...videoDrafts.map(d=>({...d,type:"video" as const}))],[drafts,videoDrafts]);
 const filteredDrafts=useMemo(()=>{
  const q=query.toLowerCase().trim();
  const result=allDrafts.filter(item=>item.name.toLowerCase().includes(q));
  return result.sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="oldest"?
    (new Date(a.updatedAt??0).getTime()||0)-(new Date(b.updatedAt??0).getTime()||0):
    (new Date(b.updatedAt??0).getTime()||0)-(new Date(a.updatedAt??0).getTime()||0));
 },[allDrafts,query,sort]);
 function refresh(){
  setDrafts(read("mim-drafts",validDraft));
  setVideoDrafts(read("mim-video-drafts",validDraft));
  setSavedIds(read("mim-bookmarks",isString));
  setMetadata(read("mim-bookmark-templates",isImageTemplate));
  setCollections(read("mim-studio-collections",validCollection));
 }
 useEffect(()=>{
  refresh();
  const requested=new URL(window.location.href).searchParams.get("tab");
  if(requested==="overview"||requested==="drafts"||requested==="saved"||requested==="liked"||requested==="collections"||requested==="backup")setTab(requested);
  const controller=new AbortController();
  fetch("/api/account/likes",{signal:controller.signal,cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error??"Liked formats unavailable.");return data;}).then(data=>{if(!controller.signal.aborted)setLikedItems(Array.isArray(data.items)?data.items:[]);}).catch(error=>{if(!controller.signal.aborted)setLikesError(error instanceof Error?error.message:"Liked formats unavailable.");}).finally(()=>{if(!controller.signal.aborted)setLikesLoading(false);});
  fetch("/api/video-templates?limit=100",{signal:controller.signal}).then(r=>r.json()).then(data=>{
   if(!controller.signal.aborted&&Array.isArray(data.templates))setVideos(data.templates.filter((v:unknown):v is StoredVideo=>isRecord(v)&&typeof v.id==="string"&&typeof v.name==="string"));
  }).catch(()=>undefined);
  window.addEventListener("storage",refresh);
  window.addEventListener("mim-bookmarks-updated",refresh);
  return()=>{controller.abort();window.removeEventListener("storage",refresh);window.removeEventListener("mim-bookmarks-updated",refresh);};
 },[]);
 const images=useMemo(()=>new Map([...starterMemes,...metadata].map(item=>[item.id,item])),[metadata]);
 const saved=useMemo(()=>savedIds.map(key=>{
   const video=key.startsWith("video:");
   const id=video?key.slice(6):key;
   const entry=video?videos.find(v=>v.id===id):images.get(id);
   return {key,id,name:entry?.name??(video?"Saved video": "Saved image"),url:video?(entry as StoredVideo|undefined)?.posterUrl:(entry as MemeTemplate|undefined)?.url,
     href:video?"/video-editor/"+encodeURIComponent(id):"/create/"+encodeURIComponent(id)+((entry as MemeTemplate|undefined)?.source==="indian"?"?source=indian":""),
     type:video?"video":"image"};
 }),[savedIds,videos,images]);
 function putDraft(key:"mim-drafts"|"mim-video-drafts",value:Draft[]){
  localStorage.setItem(key,JSON.stringify(value));
  (key==="mim-drafts"?setDrafts:setVideoDrafts)(value);
 }
 function removeDraft(d:Draft,type:"image"|"video"){
  const key=type==="image"?"mim-drafts":"mim-video-drafts";
  try{putDraft(key,read(key,validDraft).filter(item=>item.id!==d.id));setUndo({key,draft:d});setNotice("Draft removed. You can undo this.");}
  catch{setNotice("Storage could not update your drafts. Nothing was removed.");}
 }
 function restore(){
  if(!undo)return;
  try{putDraft(undo.key,[undo.draft,...read(undo.key,validDraft).filter(item=>item.id!==undo.draft.id)]);setUndo(null);setNotice("Draft restored.");}
  catch{setNotice("Could not restore the draft. Free browser storage and retry.");}
 }
 function rename(d:Draft,type:"image"|"video"){
  const next=draftName.trim().slice(0,100);
  if(!next){setNotice("Give this draft a name.");return;}
  const key=type==="image"?"mim-drafts":"mim-video-drafts";
  try{putDraft(key,read(key,validDraft).map(item=>item.id===d.id?{...item,name:next}:item));setEditing("");setNotice("Draft renamed.");}
  catch{setNotice("Could not rename this draft.");}
 }
 function removeSaved(key:string){
  try{
   const next=savedIds.filter(item=>item!==key);
   localStorage.setItem("mim-bookmarks",JSON.stringify(next));
   if(!key.startsWith("video:"))localStorage.setItem("mim-bookmark-templates",JSON.stringify(metadata.filter(item=>item.id!==key)));
   const updated=collections.map(c=>({...c,keys:c.keys.filter(item=>item!==key)}));
   localStorage.setItem("mim-studio-collections",JSON.stringify(updated));
   setSavedIds(next);setCollections(updated);setMetadata(old=>old.filter(m=>m.id!==key));
   setNotice("Format removed from saved.");window.dispatchEvent(new Event("mim-bookmarks-updated"));
  }catch{setNotice("Could not update saved formats.");}
 }
 function saveCollections(next:Collection[]){
  try{localStorage.setItem("mim-studio-collections",JSON.stringify(next));setCollections(next);setNotice("");}
  catch{setNotice("Browser storage is full. Collections could not be updated.");}
 }
 function addCollection(){
  const name=newCollection.trim().slice(0,55);
  if(!name)return;
  if(collections.some(c=>c.name.toLowerCase()===name.toLowerCase())){setNotice("A collection with that name already exists.");return;}
  saveCollections([...collections,{id:crypto.randomUUID(),name,keys:[]}]);setNewCollection("");
 }
 function assignCollection(key:string,id:string){
  saveCollections(collections.map(c=>({...c,keys:id===c.id?[...new Set([...c.keys,key])]:c.keys.filter(item=>item!==key)})));
 }
 function exportBackup(){
  try{
   const record:Record<string,unknown>={format:"meme-is-mine-backup",version:1,createdAt:new Date().toISOString()};
   backupKeys.forEach(key=>{record[key]=JSON.parse(localStorage.getItem(key)??"[]");});
   const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");link.href=url;link.download="memeismine-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),5000);
   setNotice("Your backup was prepared for download.");
  }catch{setNotice("Could not create a backup. Check browser storage.");}
 }
 async function importBackup(file:File){
  if(file.size>20*1024*1024){setNotice("Backup is too large. Maximum 20 MB.");return;}
  setBusy(true);
  try{
   const value:unknown=JSON.parse(await file.text());
   if(!isRecord(value)||value.format!=="meme-is-mine-backup"||value.version!==1)throw Error("Not a Meme Is Mine backup.");
   const result:Record<string,unknown[]>={};
   for(const key of backupKeys){
    const collection=value[key];
    if(!Array.isArray(collection)||collection.length>5000)throw Error("Backup contains invalid collections.");
    const valid=key==="mim-drafts"||key==="mim-video-drafts"?collection.every(validDraft):
      key==="mim-bookmarks"?collection.every(isString):
      key==="mim-bookmark-templates"?collection.every(isImageTemplate):collection.every(validCollection);
    if(!valid)throw Error("Backup contains invalid "+key+".");
    result[key]=collection;
   }
   const before=Object.fromEntries(backupKeys.map(key=>[key,localStorage.getItem(key)]));
   try{backupKeys.forEach(key=>localStorage.setItem(key,JSON.stringify(result[key])));}
   catch(error){
    backupKeys.forEach(key=>{try{if(before[key]===null)localStorage.removeItem(key);else localStorage.setItem(key,before[key]);}catch{}});
    throw error;
   }
   refresh();setNotice("Backup restored on this device.");window.dispatchEvent(new Event("mim-bookmarks-updated"));
  }catch(error){setNotice(error instanceof Error?error.message:"Could not import the backup.");}
  finally{setBusy(false);if(input.current)input.current.value="";}
 }
 const draftCard=(d:Draft & {type:"image"|"video"})=>{
  const picture=safeImage(d.url);
  const href=(d.type==="image"?"/create/":"/video-editor/")+encodeURIComponent(d.templateId)+"?draft="+encodeURIComponent(d.id)+(d.source==="indian"?"&source=indian":"");
  return <article className="rf-studio-card" key={d.type+":"+d.id}>
   <div className="rf-studio-card-art">{picture?<Image src={picture} width={450} height={320} alt={d.name} unoptimized/>:d.type==="image"?<FileImage size={42}/>:<Clapperboard size={42}/>}
    <span>{d.type==="image"?"IMAGE DRAFT":"VIDEO DRAFT"}</span></div>
   <div className="rf-studio-card-details">
    {editing===d.id?<form onSubmit={event=>{event.preventDefault();rename(d,d.type);}} className="rf-rename-form"><input value={draftName} onChange={e=>setDraftName(e.target.value)} maxLength={100} aria-label="New draft name" autoFocus/><button type="submit" aria-label="Save name"><Check size={17}/></button><button type="button" aria-label="Cancel rename" onClick={()=>setEditing("")}><X size={17}/></button></form>:<h3>{d.name}</h3>}
    <p>{displayDate(d.updatedAt)}</p>
    <div className="rf-studio-card-actions"><Link href={href}>Continue <ArrowUpRight size={16}/></Link><button type="button" aria-label={"Rename "+d.name} onClick={()=>{setEditing(d.id);setDraftName(d.name);}}><Pencil size={17}/></button><button type="button" aria-label={"Delete "+d.name} onClick={()=>removeDraft(d,d.type)}><Trash2 size={17}/></button></div>
   </div>
  </article>;
 };
 const savedCard=(s:typeof saved[number])=>{
  const picture=safeImage(s.url);
  const assigned=collections.find(c=>c.keys.includes(s.key))?.id??"";
  return <article className="rf-studio-card" key={s.key}>
   <div className="rf-studio-card-art">{picture?<Image src={picture} width={450} height={320} alt={s.name} unoptimized/>:s.type==="video"?<Clapperboard size={42}/>:<FileImage size={42}/>}<span>{s.type==="video"?"MOVING FORMAT":"STILL FORMAT"}</span></div>
   <div className="rf-studio-card-details"><h3>{s.name}</h3><div className="rf-studio-card-actions"><Link href={s.href}>Create <ArrowUpRight size={16}/></Link><button type="button" aria-label={"Remove "+s.name} onClick={()=>removeSaved(s.key)}><Trash2 size={17}/></button></div>
    {collections.length>0&&<label className="rf-collection-assign">COLLECTION<select aria-label={"Collection for "+s.name} value={assigned} onChange={e=>assignCollection(s.key,e.target.value)}><option value="">Unassigned</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
   </div>
  </article>;
 };
 return <main id="main-content" tabIndex={-1} className="rf-site rf-studio">
  <SiteHeader/>
  <header className="rf-studio-hero"><div className="container rf-studio-hero-inner"><div><span className="rf-kicker">YOUR CREATIVE CORNER / SAVED ON THIS DEVICE</span><h1>Welcome back<br/>to <em>your space.</em></h1><p>Ideas in progress. Formats worth keeping. Everything you need to pick up where you left off.</p></div><div className="rf-studio-hero-decoration" aria-hidden="true">M<span>✳</span>M.</div></div></header>
  <div className="container rf-studio-workspace">
   <nav className="rf-studio-tabs" aria-label="Studio sections">{sections.map(({id,name,Icon})=><button type="button" key={id} aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}><Icon size={19}/><span>{name}</span>{tab===id&&!reduced&&<motion.span layoutId="rf-studio-tab-indicator" className="rf-studio-tab-indicator"/>}</button>)}</nav>
   <AnimatePresence mode="wait" initial={false}><motion.div key={tab} initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={reduced?{opacity:0}:{opacity:0,y:-9}} transition={{duration:.22}}>
    {tab==="overview"&&<>
     <div className="rf-studio-heading"><div><span className="rf-kicker">THE CURRENT STATE OF PLAY</span><h2>Your work, <em>at a glance.</em></h2></div><Link href="/explore">Make something new <ArrowUpRight size={17}/></Link></div>
     <div className="rf-studio-stats"><button type="button" onClick={()=>setTab("drafts")}><span>01 / IN PROGRESS</span><strong>{allDrafts.length.toString().padStart(2,"0")}</strong><span>Drafts <ArrowUpRight size={17}/></span></button>
      <button type="button" onClick={()=>setTab("saved")}><span>02 / THE GOOD STUFF</span><strong>{savedIds.length.toString().padStart(2,"0")}</strong><span>Saved formats <ArrowUpRight size={17}/></span></button>
      <button type="button" onClick={()=>setTab("liked")}><span>03 / YOUR FAVOURITES</span><strong>{likesLoading?"··":likedItems.length.toString().padStart(2,"0")}</strong><span>Liked formats <ArrowUpRight size={17}/></span></button>
      <button type="button" onClick={()=>setTab("collections")}><span>04 / NICELY ORGANIZED</span><strong>{collections.length.toString().padStart(2,"0")}</strong><span>Collections <ArrowUpRight size={17}/></span></button></div>
     <div className="rf-studio-heading rf-studio-subhead"><div><span className="rf-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>Keep <em>going.</em></h2></div><button type="button" onClick={()=>setTab("drafts")}>View all drafts <ArrowRight size={17}/></button></div>
     {allDrafts.length?<div className="rf-studio-grid">{filteredDrafts.slice(0,3).map(draftCard)}</div>:<div className="rf-studio-empty"><FileImage size={37}/><h3>Your first idea starts here.</h3><p>Save a meme in the editor and it will be waiting in this browser.</p><Link href="/explore">Find a format <ArrowUpRight size={17}/></Link></div>}
    </>}
    {tab==="drafts"&&<>
     <div className="rf-studio-heading"><div><span className="rf-kicker">THE WORK IN PROGRESS</span><h2>Unfinished <em>business.</em></h2></div><span>{countLabel(allDrafts.length,"draft")}</span></div>
     <div className="rf-studio-controls"><label><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search saved drafts" aria-label="Search drafts"/></label><label><SlidersHorizontal size={18}/><select aria-label="Sort drafts" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Recently edited</option><option value="oldest">Oldest first</option><option value="name">Alphabetical</option></select></label></div>
     {filteredDrafts.length?<div className="rf-studio-grid">{filteredDrafts.map(draftCard)}</div>:<div className="rf-studio-empty"><FileImage size={35}/><h3>No drafts in view.</h3><p>Try another search or create your first one.</p><Link href="/explore">Browse templates <ArrowUpRight size={17}/></Link></div>}
    </>}
    {tab==="saved"&&<>
     <div className="rf-studio-heading"><div><span className="rf-kicker">YOUR PERSONAL PICKS</span><h2>Keep the <em>good ones.</em></h2></div><span>{countLabel(saved.length,"format")}</span></div>
     <p className="rf-studio-context">All saved formats live in this browser. Assign them to personal collections below.</p>
     {saved.length?<div className="rf-studio-grid">{saved.map(savedCard)}</div>:<div className="rf-studio-empty"><Bookmark size={36}/><h3>Nothing saved yet.</h3><p>Bookmark a format in the gallery and it will appear right here.</p><Link href="/templates">Explore the archive <ArrowUpRight size={17}/></Link></div>}
    </>}
    {tab==="liked"&&<>
     <div className="rf-studio-heading"><div><span className="rf-kicker">THE FORMATS YOU LOVE</span><h2>The ones that <em>clicked.</em></h2></div><span>{likedItems.length} LIKED</span></div>
     <p className="rf-studio-context">Likes belong to your account. Unlike browser-only drafts, these follow you when you sign in.</p>
     {likesError?<div className="rf-studio-empty"><Heart size={36}/><h3>Likes are unavailable.</h3><p>{likesError}</p><p>Make sure the account likes database migration has been applied.</p></div>:
      likesLoading?<div className="rf-studio-empty"><Heart size={36}/><h3>Finding your favourites.</h3></div>:
      likedItems.length?<div className="rf-studio-grid">{likedItems.map(item=><article key={item.key} className="rf-studio-card">
        <div className="rf-studio-card-art">{safeImage(item.image)?<Image src={safeImage(item.image)} width={450} height={320} alt={item.name} unoptimized/>:<Heart size={37}/>}<span>{item.kind==="video"?"MOVING FORMAT":"STILL FORMAT"}</span></div>
        <div className="rf-studio-card-details"><h3>{item.name}</h3><div className="rf-studio-card-actions"><Link href={item.editorHref}>Use this format <ArrowUpRight size={16}/></Link></div></div>
       </article>)}</div>:
      <div className="rf-studio-empty"><Heart size={36}/><h3>Nothing liked yet.</h3><p>Open a template preview and leave a like. It will join your collection here.</p><Link href="/explore">Explore the gallery <ArrowUpRight size={17}/></Link></div>}
    </>}
    {tab==="collections"&&<>
     <div className="rf-studio-heading"><div><span className="rf-kicker">THINK OF THESE AS YOUR PERSONAL MOOD BOARDS</span><h2>Make your <em>own shelves.</em></h2></div></div>
     <form className="rf-collection-create" onSubmit={e=>{e.preventDefault();addCollection();}}><label htmlFor="new-collection">NEW COLLECTION</label><input id="new-collection" value={newCollection} onChange={e=>setNewCollection(e.target.value)} maxLength={55} placeholder="e.g. Monday reactions"/><button type="submit" disabled={!newCollection.trim()}><Plus size={18}/> Add collection</button></form>
     {collections.length?<div className="rf-collection-grid">{collections.map(c=><article key={c.id} className="rf-collection-card"><span>COLLECTION / {String(c.keys.length).padStart(2,"0")}</span><Folder size={36}/><h3>{c.name}</h3><p>{countLabel(c.keys.length,"saved format")}</p><div>{c.keys.map(key=>{const item=saved.find(s=>s.key===key);return item?<Link href={item.href} key={key}>{item.name} <ArrowUpRight size={14}/></Link>:null;})}</div><button type="button" onClick={()=>saveCollections(collections.filter(item=>item.id!==c.id))} aria-label={"Delete collection "+c.name}>Delete collection <Trash2 size={15}/></button></article>)}</div>:<div className="rf-studio-empty"><Folder size={36}/><h3>Your collection starts with a name.</h3><p>Create a collection, then assign saved templates to it in the Saved formats tab.</p></div>}
    </>}
    {tab==="backup"&&<>
     <div className="rf-studio-heading"><div><span className="rf-kicker">YOUR WORK, YOUR DEVICE</span><h2>Take it <em>with you.</em></h2></div></div>
     <div className="rf-backup-grid">
       <section><HardDriveDownload size={40}/><span>01 / EXPORT</span><h3>Make a local backup.</h3><p>Download a JSON file containing your drafts, saved formats and collections. Files containing your own images may be large.</p><button type="button" onClick={exportBackup}>Download backup <ArrowDownToLine size={18}/></button></section>
       <section><HardDriveUpload size={40}/><span>02 / RESTORE</span><h3>Bring your work back.</h3><p>Import a backup made by Meme Is Mine. Restoring replaces the local drafts, saved items and collections currently on this device.</p><input type="file" ref={input} accept=".json,application/json" aria-label="Choose a Meme Is Mine backup" onChange={e=>{const file=e.target.files?.[0];if(file)void importBackup(file);}} disabled={busy}/></section>
     </div><p className="rf-studio-context">These actions operate only on this browser. They do not enable automatic cloud sync, and your backup may contain personal uploaded images.</p>
    </>}
   </motion.div></AnimatePresence>
  </div>
  <section className="rf-studio-end"><div className="container"><div><span className="rf-kicker">READY FOR THE NEXT ONE?</span><h2>Start something <em>new.</em></h2></div><div><Link href="/create/upload"><Upload size={18}/> Upload an image</Link><Link href="/video-templates"><Clapperboard size={18}/> Browse motion formats</Link></div></div></section>
  {notice&&<div className="rf-studio-notice" role="status"><span>{notice}</span>{undo&&<button type="button" onClick={restore}>Undo</button>}<button type="button" aria-label="Dismiss notification" onClick={()=>{setNotice("");setUndo(null);}}><X size={18}/></button></div>}
  <SiteFooter/>
 </main>;
}
