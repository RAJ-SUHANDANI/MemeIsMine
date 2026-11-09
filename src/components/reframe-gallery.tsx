/* Template posters use original image sources. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Grid2X2, Layers3, LayoutList, PanelsTopLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ReframePreview, type ReframeItem } from "./reframe-preview";

export type GalleryLayout = "grid" | "coverflow" | "stack" | "list";
const layouts: {key:GalleryLayout; label:string; Icon:typeof Grid2X2}[] = [
  {key:"grid",label:"Grid",Icon:Grid2X2},
  {key:"coverflow",label:"Flow",Icon:PanelsTopLeft},
  {key:"stack",label:"Stack",Icon:Layers3},
  {key:"list",label:"List",Icon:LayoutList},
];

function storageIds():string[] {
  try {
    const parsed:unknown=JSON.parse(localStorage.getItem("mim-bookmarks")??"[]");
    return Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==="string"):[];
  } catch {return [];}
}

export function ReframeGallery({items,kind,variant="showcase",path}:{
  items:ReframeItem[];kind:"image"|"video";variant?:"showcase"|"objects";path:string;
}) {
  const reduced=useReducedMotion();
  const [layout,setLayout]=useState<GalleryLayout>("grid");
  const [selected,setSelected]=useState(0);
  const [preview,setPreview]=useState<ReframeItem|null>(null);
  const [bookmarks,setBookmarks]=useState<string[]>([]);
  const [notice,setNotice]=useState("");
  const [requested,setRequested]=useState<string|null>(null);
  useEffect(()=>{
    try {
      const stored=localStorage.getItem("mim-gallery-mode-"+kind);
      if(stored==="grid"||stored==="coverflow"||stored==="stack"||stored==="list") setLayout(stored);
    } catch {}
    setBookmarks(storageIds());
    const current=new URL(window.location.href);
    setRequested(current.searchParams.get("preview"));
    function changed(){setBookmarks(storageIds());}
    window.addEventListener("storage",changed);
    window.addEventListener("mim-bookmarks-updated",changed);
    return ()=>{window.removeEventListener("storage",changed);window.removeEventListener("mim-bookmarks-updated",changed);};
  },[kind]);
  useEffect(()=>{
    if(!requested) return;
    const found=items.find(item=>item.id===requested);
    if(found){setPreview(found);setRequested(null);return;}
    const controller=new AbortController();
    const src=kind==="image"?"/api/memes?id="+encodeURIComponent(requested):"/api/video-templates?slug="+encodeURIComponent(requested);
    fetch(src,{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{
      if(!data?.success||controller.signal.aborted) return;
      const t=data.meme??data.template;
      if(!t) return;
      setPreview(kind==="image"?{
        id:t.id,name:t.name,image:t.url,kind:"image",category:t.category??"Image",likeId:t.likeId,
        editorHref:"/create/"+encodeURIComponent(t.id)+(t.source==="indian"||t.source==="indianmemetemplates"?"?source=indian":""),
        sourceHref:t.originalUrl,
      }:{
        id:t.id,name:t.name,image:t.posterUrl??"",kind:"video",category:t.category??"Video",likeId:t.likeId,
        editorHref:"/video-editor/"+encodeURIComponent(t.id),mediaUrl:t.url,mediaType:t.mediaType,sourceHref:t.sourcePage,
      });
      setRequested(null);
    }).catch(()=>undefined);
    return ()=>controller.abort();
  },[items,kind,requested]);
  function changeLayout(next:GalleryLayout){
    setLayout(next);setSelected(0);
    try {localStorage.setItem("mim-gallery-mode-"+kind,next);} catch {}
  }
  function save(item:ReframeItem) {
    const key=item.kind==="video"?"video:"+item.id:item.id;
    const next=bookmarks.includes(key)?bookmarks.filter(id=>id!==key):[...bookmarks,key];
    try {
      if(item.kind==="image"){
        const raw:unknown=JSON.parse(localStorage.getItem("mim-bookmark-templates")??"[]");
        const metadata=Array.isArray(raw)?raw.filter(value=>value && typeof value==="object" && value.id!==item.id):[];
        if(!bookmarks.includes(key)) metadata.push({
          id:item.id,name:item.name,url:item.image,
          width:1200,height:1200,category:item.category,
          source:item.editorHref.includes("source=indian")?"indian":undefined,
        });
        localStorage.setItem("mim-bookmark-templates",JSON.stringify(metadata));
      }
      localStorage.setItem("mim-bookmarks",JSON.stringify(next));
      setBookmarks(next);setNotice("");
      window.dispatchEvent(new Event("mim-bookmarks-updated"));
    } catch {setNotice("Could not save. Check browser storage and try again.");}
  }
  function open(item:ReframeItem) {
    setPreview(item);
    const url=new URL(window.location.href);
    url.searchParams.set("preview",item.id);
    window.history.replaceState(window.history.state,"",url.pathname+url.search);
  }
  function close() {
    setPreview(null);
    const url=new URL(window.location.href);
    url.searchParams.delete("preview");
    window.history.replaceState(window.history.state,"",url.pathname+url.search);
  }
  const isSpatial=layout==="coverflow"||layout==="stack";
  const active=Math.min(selected,Math.max(0,items.length-1));
  function move(delta:number){setSelected(n=>Math.max(0,Math.min(items.length-1,n+delta)));}
  return <section className={"rf-gallery rf-gallery-"+variant} aria-label={kind==="video"?"Video template gallery":"Image template gallery"} data-layout={layout}>
    <div className="rf-gallery-toolbar">
      <div className="rf-arrangements" role="group" aria-label="Gallery arrangement">
        {layouts.map(({key,label,Icon})=><button key={key} type="button" aria-pressed={layout===key} onClick={()=>changeLayout(key)}><Icon size={17}/><span>{label}</span></button>)}
      </div>
      {isSpatial && <div className="rf-gallery-steppers">
        <button type="button" aria-label="Previous template" disabled={active===0} onClick={()=>move(-1)}><ArrowLeft size={18}/></button>
        <output aria-live="polite">{String(active+1).padStart(2,"0")} / {String(items.length).padStart(2,"0")}</output>
        <button type="button" aria-label="Next template" disabled={active===items.length-1} onClick={()=>move(1)}><ArrowRight size={18}/></button>
      </div>}
    </div>
    <div className="rf-gallery-stage" data-layout={layout} onKeyDown={event=>{
      if(!isSpatial) return;
      if(event.key==="ArrowRight"){event.preventDefault();move(1);}
      if(event.key==="ArrowLeft"){event.preventDefault();move(-1);}
    }}>
      {items.map((item,index)=>{
        if(isSpatial && Math.abs(index-active)>2) return null;
        const offset=index-active;
        const key=item.kind==="video"?"video:"+item.id:item.id;
        return <motion.article key={item.kind+"-"+item.id} className="rf-gallery-object"
          layout={!reduced && !isSpatial ? "position" : false}
          style={isSpatial?{zIndex:10-Math.abs(offset),["--rf-offset" as string]:offset,["--rf-depth" as string]:Math.abs(offset)}:undefined}
          data-active={isSpatial&&index===active?true:undefined}
          data-side={isSpatial&&index!==active?true:undefined}>
          <motion.div className="rf-gallery-object-inner" whileHover={reduced||isSpatial?undefined:{y:-5}} transition={{type:"spring",stiffness:350,damping:30}}>
            <button type="button" className="rf-gallery-art-trigger" aria-label={"Preview "+item.name}
              onClick={()=>isSpatial&&index!==active?setSelected(index):open(item)}>
              <motion.div layoutId={"rf-art-"+item.kind+"-"+item.id} className="rf-gallery-art" transition={{type:"spring",stiffness:330,damping:35}}>
                {item.image?<img src={item.image} alt="" loading={index<4?"eager":"lazy"}/>:<span className="rf-poster-placeholder">MIM / {item.kind==="video"?"MOTION":"STILL"}</span>}
              </motion.div>
              <span className="rf-gallery-overprint"><span>{item.kind==="video"?"MOTION":"STILL"}</span><ArrowUpRight size={17}/></span>
            </button>
            <div className="rf-gallery-object-meta">
              <button type="button" className="rf-card-name" onClick={()=>open(item)}>{item.name}</button>
              <button type="button" className="rf-card-bookmark" onClick={()=>save(item)} aria-pressed={bookmarks.includes(key)} aria-label={bookmarks.includes(key)?"Remove saved template":"Save template"}><Bookmark size={18} fill={bookmarks.includes(key)?"currentColor":"none"}/></button>
            </div>
            <div className="rf-gallery-object-foot"><span>{item.category}</span><span>{String(index+1).padStart(3,"0")}</span></div>
          </motion.div>
        </motion.article>;
      })}
    </div>
    {notice&&<p className="rf-gallery-notice" role="alert">{notice}</p>}
    <AnimatePresence>{preview&&<ReframePreview key={preview.kind+preview.id} item={preview} onClose={close}
      saved={bookmarks.includes(preview.kind==="video"?"video:"+preview.id:preview.id)} onSave={()=>save(preview)} galleryPath={path}/>}</AnimatePresence>
  </section>;
}
