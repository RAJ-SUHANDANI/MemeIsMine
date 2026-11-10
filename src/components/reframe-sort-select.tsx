"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export const sortOptions=[
  {key:"popular",label:"Most popular",detail:"The formats people know"},
  {key:"trending",label:"Trending",detail:"Currently in conversation"},
  {key:"new",label:"New arrivals",detail:"Fresh from the archive"},
  {key:"name",label:"A to Z",detail:"An alphabetical index"},
] as const;

export function MotionSortSelect({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [open,setOpen]=useState(false);
  const reduced=useReducedMotion();
  const id=useId();
  const container=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const elements=useRef<(HTMLButtonElement|null)[]>([]);
  const selected=sortOptions.find(x=>x.key===value)??sortOptions[0];
  useEffect(()=>{
    if(!open)return;
    const handlePointer=(event:PointerEvent)=>{
      if(container.current&&!container.current.contains(event.target as Node))setOpen(false);
    };
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){setOpen(false);trigger.current?.focus();}
    };
    document.addEventListener("pointerdown",handlePointer);
    document.addEventListener("keydown",handleKey);
    return()=>{
      document.removeEventListener("pointerdown",handlePointer);
      document.removeEventListener("keydown",handleKey);
    };
  },[open]);
  const focus=(index:number)=>elements.current[(index+sortOptions.length)%sortOptions.length]?.focus();
  const choose=(key:string)=>{onChange(key);setOpen(false);trigger.current?.focus();};
  return <div ref={container} className="rf-motion-sort">
    <span className="rf-motion-sort-label">SORT BY</span>
    <button ref={trigger} id={id+"-trigger"} type="button" className="rf-motion-sort-trigger"
      aria-haspopup="listbox" aria-controls={id+"-list"} aria-expanded={open}
      onClick={()=>{setOpen(!open);if(!open)requestAnimationFrame(()=>focus(Math.max(0,sortOptions.findIndex(x=>x.key===value))));}}
      onKeyDown={e=>{
        if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setOpen(true);requestAnimationFrame(()=>focus(Math.max(0,sortOptions.findIndex(x=>x.key===value))));}
      }}>
      <SlidersHorizontal size={17} aria-hidden="true"/>
      <span>{selected.label}</span>
      <motion.span animate={{rotate:open?180:0}} transition={{duration:.2}}><ChevronDown size={18}/></motion.span>
    </button>
    <AnimatePresence>
      {open && <motion.div className="rf-motion-sort-panel" id={id+"-list"} role="listbox" aria-label="Sort image and video templates"
        initial={reduced?false:{opacity:0,scale:.96,y:-8}} animate={{opacity:1,scale:1,y:0}}
        exit={reduced?{opacity:0}:{opacity:0,scale:.97,y:-7}}
        transition={{type:"spring",stiffness:470,damping:37}}>
        <span className="rf-motion-sort-panel-caption">ARRANGE THE ARCHIVE</span>
        {sortOptions.map((option,index)=><button key={option.key} ref={node=>{elements.current[index]=node;}}
          type="button" role="option" aria-selected={value===option.key}
          tabIndex={index===sortOptions.findIndex(o=>o.key===value)?0:-1}
          onClick={()=>choose(option.key)}
          onKeyDown={event=>{
            if(event.key==="ArrowDown"){event.preventDefault();focus(index+1);}
            if(event.key==="ArrowUp"){event.preventDefault();focus(index-1);}
            if(event.key==="Home"){event.preventDefault();focus(0);}
            if(event.key==="End"){event.preventDefault();focus(sortOptions.length-1);}
            if(event.key==="Tab")setOpen(false);
          }}
          className={value===option.key?"is-selected":""}>
          <span><strong>{option.label}</strong><small>{option.detail}</small></span>
          {value===option.key&&<motion.span layoutId="rf-sort-check" className="rf-motion-sort-check"><Check size={17}/></motion.span>}
        </button>)}
      </motion.div>}
    </AnimatePresence>
  </div>;
}
