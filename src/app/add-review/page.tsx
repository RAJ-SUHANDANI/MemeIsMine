"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, MessageCircle, PenLine, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
const key="mim-user-reviews";
type Note={id:string;name:string;review:string;createdAt:string};
function valid(value:unknown):value is Note{
 return !!value && typeof value==="object" && "name" in value && typeof value.name==="string" && "review" in value && typeof value.review==="string" && "id" in value && typeof value.id==="string" && "createdAt" in value && typeof value.createdAt==="string";
}
function readNotes():Note[]{try{const stored:unknown=JSON.parse(localStorage.getItem(key)??"[]");return Array.isArray(stored)?stored.filter(valid):[];}catch{return [];}}
export default function FeedbackPage(){
 const reduce=useReducedMotion();
 const [name,setName]=useState("");
 const [note,setNote]=useState("");
 const [notes,setNotes]=useState<Note[]>([]);
 const [notice,setNotice]=useState("");
 useEffect(()=>setNotes(readNotes()),[]);
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const cleanName=name.trim(),cleanNote=note.trim();
  if(!cleanName||!cleanNote){setNotice("Add a name and your note.");return;}
  if(cleanName.length>60||cleanNote.length>500){setNotice("Keep the name under 60 characters and the note under 500.");return;}
  const next=[{id:"review-"+crypto.randomUUID(),name:cleanName,review:cleanNote,createdAt:new Date().toISOString()},...readNotes()].slice(0,100);
  try{localStorage.setItem(key,JSON.stringify(next));setNotes(next);setName("");setNote("");setNotice("Saved on this device. This note is not published to other visitors.");window.dispatchEvent(new Event("mim-reviews-updated"));}
  catch{setNotice("Could not save. Check available browser storage.");}
 }
 function remove(id:string){
  try{const next=readNotes().filter(item=>item.id!==id);localStorage.setItem(key,JSON.stringify(next));setNotes(next);setNotice("Note removed from this device.");window.dispatchEvent(new Event("mim-reviews-updated"));}
  catch{setNotice("Could not remove this note.");}
 }
 return <main id="main-content" tabIndex={-1} className="rf-site rf-notes">
  <SiteHeader/>
  <section className="rf-notes-hero"><div className="container"><span className="rf-kicker">THE SUGGESTION BOX / PRIVATE NOTES</span><h1>Tell it <em>like it is.</em></h1><p>Your thoughts about Meme Is Mine, saved privately in this browser. This is a personal notebook, not a public review wall or support ticket.</p></div></section>
  <div className="container rf-notes-layout">
   <div className="rf-notes-side"><MessageCircle size={45}/><span className="rf-kicker">NOTES FROM THE SIDELINES</span><h2>Even the good jokes need editing.</h2><p>Capture a problem, a clever idea or something you liked. If you need to contact the creator, use the Contact page instead.</p><Link href="/contact">Send a message <ArrowUpRight size={18}/></Link></div>
   <div className="rf-notes-main">
    <form onSubmit={submit} className="rf-notes-form"><div className="rf-notes-form-header"><PenLine size={26}/><span>WRITE A NOTE / 001</span></div>
     <label htmlFor="rf-note-name">YOUR NAME</label><input id="rf-note-name" value={name} onChange={e=>setName(e.target.value)} required maxLength={60} placeholder="How should this note be labelled?"/>
     <label htmlFor="rf-note-text">WHAT'S ON YOUR MIND?</label><textarea id="rf-note-text" value={note} onChange={e=>setNote(e.target.value)} required rows={6} maxLength={500} placeholder="What worked? What could be better?"/>
     <div className="rf-notes-form-foot"><span>{note.length} / 500 CHARACTERS</span><button type="submit">Save privately <ArrowUpRight size={18}/></button></div>
    </form>
    {notice&&<p className="rf-notes-notice" role="status">{notice}</p>}
    <div className="rf-notes-local"><div><span className="rf-kicker">SAVED IN THIS BROWSER</span><h2>Your notes.</h2></div><span>{notes.length} TOTAL</span></div>
    {notes.length?<div className="rf-notes-list"><AnimatePresence>{notes.map(item=><motion.article key={item.id} initial={reduce?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,x:20}}><div><strong>{item.name}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></div><p>{item.review}</p><button type="button" aria-label={"Delete note from "+item.name} onClick={()=>remove(item.id)}><Trash2 size={16}/> Delete</button></motion.article>)}</AnimatePresence></div>:
     <div className="rf-notes-empty">No notes on this device yet. Your first one can go above.</div>}
    <Link href="/" className="rf-notes-back"><ArrowLeft size={17}/> Back to the homepage</Link>
   </div>
  </div>
  <SiteFooter/>
 </main>;
}
