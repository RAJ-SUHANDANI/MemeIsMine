"use client";
import { useEffect, useRef, useState } from "react";
import { setTemplateLike } from "@/app/api/template-likes/actions";

export type LikeState={key:string;count:number;revision:number;liked:boolean;signedIn:boolean};

export function useTemplateLikes(key:string){
 const [state,setState]=useState<LikeState|null>(null);
 const [failed,setFailed]=useState(false);
 const [optimistic,setOptimistic]=useState<{liked:boolean;count:number}|null>(null);
 const pending=useRef(false);
 function accept(incoming:LikeState,fromMutation=false){
  setState(current=>current&&current.revision>incoming.revision
   ?fromMutation?{...current,liked:incoming.liked,signedIn:incoming.signedIn}:current
   :incoming);
 }
 useEffect(()=>{
  const controller=new AbortController();
  const load=async()=>{
   if(pending.current||controller.signal.aborted)return;
   try{
    const response=await fetch("/api/template-likes?key="+encodeURIComponent(key),{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw new Error("Likes unavailable");
    const data:LikeState=await response.json();
    if(!controller.signal.aborted&&!pending.current){setState(current=>current&&current.revision>data.revision?current:data);setFailed(false);}
   }catch{if(!controller.signal.aborted)setFailed(true);}
  };
  void load();
  const timer=window.setInterval(()=>{if(!document.hidden)void load();},15000);
  const refresh=()=>{if(!document.hidden)void load();};
  document.addEventListener("visibilitychange",refresh);
  return()=>{controller.abort();window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
 },[key]);
 async function react(liked:boolean){
  if(!state?.signedIn||pending.current||state.liked===liked)return;
  pending.current=true;
  setOptimistic({liked,count:Math.max(0,state.count+(liked?1:-1))});setFailed(false);
  try{const result=await setTemplateLike(key,liked);if(!result)throw Error("Like failed");accept(result,true);}
  catch{setFailed(true);}
  finally{pending.current=false;setOptimistic(null);}
 }
 return{state,failed,busy:optimistic!==null,liked:optimistic?.liked??state?.liked??false,
  count:optimistic?.count??state?.count??null,react};
}
