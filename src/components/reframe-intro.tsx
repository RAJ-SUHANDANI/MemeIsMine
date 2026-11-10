"use client";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const cards=[
  {src:"/templates/drake.jpg",angle:-16,x:-220,y:-80,z:-170},
  {src:"/templates/distracted-boyfriend.jpg",angle:14,x:240,y:-110,z:-130},
  {src:"/templates/woman-cat.jpg",angle:8,x:200,y:145,z:-80},
  {src:"/templates/two-buttons.jpg",angle:-10,x:-180,y:150,z:-100},
];

/** This is a deliberately timed animation, not an artificial loading-progress indicator.
 * The homepage is not revealed until the progress sequence actually completes AND
 * the cinematic exit has finished. A11y: skip and reduced-motion bypass are available.
 */
export function ReframeIntro({onComplete}:{onComplete:()=>void}) {
  const reduced=useReducedMotion();
  const [phase,setPhase]=useState<"playing"|"exiting"|"done">("playing");
  const skipButton=useRef<HTMLButtonElement>(null);
  const done=useRef(false);
  const callback=useRef(onComplete);
  callback.current=onComplete;

  function complete() {
    if(done.current)return;
    done.current=true;
    try{sessionStorage.setItem("mim-intro-played","1");}catch{/* Browsing still works. */}
    setPhase("exiting");
  }
  useEffect(()=>{
    let seen=false;
    try{seen=sessionStorage.getItem("mim-intro-played")==="1";}catch{}
    if(seen||reduced){
      done.current=true;
      setPhase("done");
      callback.current();
    }
  },[reduced]);
  useEffect(()=>{
    if(phase==="done"||reduced)return;
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    skipButton.current?.focus();
    function key(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();complete();}
      if(event.key==="Tab"){event.preventDefault();skipButton.current?.focus();}
    }
    window.addEventListener("keydown",key);
    return()=>{
      document.body.style.overflow=overflow;
      window.removeEventListener("keydown",key);
      previous?.focus();
    };
  },[phase,reduced]);

  return <AnimatePresence onExitComplete={()=>{setPhase("done");callback.current();}}>
    {phase==="playing" && !reduced &&
     <motion.div key="intro" className="rf-intro" role="dialog" aria-modal="true"
       aria-label="Meme Is Mine introduction" initial={{opacity:1}}
       exit={{opacity:0,clipPath:"inset(0 0 100% 0)"}}
       transition={{duration:.7,ease:[.76,0,.24,1]}}>
       <div className="rf-intro-top">
         <span>MEME IS MINE <b>✳</b> THE INTERNET IS YOURS</span>
         <button type="button" ref={skipButton} onClick={complete}>Skip intro <ArrowUpRight size={16}/></button>
       </div>
       <div className="rf-intro-stage">
         <div className="rf-intro-orbit" aria-hidden="true">
           {cards.map((card,index)=><motion.div key={card.src} className="rf-intro-card"
             initial={{opacity:0,x:card.x*1.65,y:card.y*1.7,z:-450,rotateY:index%2?45:-45,rotateZ:card.angle*2}}
             animate={{opacity:1,x:card.x,y:card.y,z:card.z,rotateY:0,rotateZ:card.angle}}
             transition={{type:"spring",stiffness:74,damping:19,delay:index*.18}}>
             <Image src={card.src} width={220} height={170} alt=""/>
           </motion.div>)}
         </div>
         <motion.div className="rf-intro-wordmark"
           initial={{opacity:0,scale:.76,filter:"blur(18px)"}}
           animate={{opacity:1,scale:1,filter:"blur(0px)"}}
           transition={{duration:1.35,delay:.55,ease:[.22,1,.36,1]}}>
           <span>MEME</span><span>IS <em>MINE.</em></span>
         </motion.div>
         <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
           transition={{delay:1.65,duration:.65}}>Find the format. Own the punchline.</motion.p>
       </div>
       <div className="rf-intro-bottom">
         <span>EST. ON THE INTERNET</span>
         <div className="rf-intro-line">
           <motion.span initial={{scaleX:0}} animate={{scaleX:1}}
             transition={{duration:4.7,ease:[.32,0,.28,1]}}
             onAnimationComplete={complete}/>
         </div>
         <span>THE NEXT ONE IS YOURS</span>
       </div>
     </motion.div>}
  </AnimatePresence>;
}
