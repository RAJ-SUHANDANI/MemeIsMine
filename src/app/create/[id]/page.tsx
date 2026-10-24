"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Download, Eye, ImagePlus, Layers, Save, Type, Undo2, Redo2, Shapes, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
type Draft = { id:string; templateId:string; name:string; url:string; topText:string; bottomText:string; fontSize:number; outline:boolean; updatedAt:string };
const DRAFTS_KEY = "mim-drafts";
export default function EditorPage() {
  const params = useParams<{id:string}>(); const router = useRouter(); const searchParams = useSearchParams(); const draftId = searchParams.get("draft"); const id = params.id;
  const [catalog,setCatalog] = useState<MemeTemplate[]>(starterMemes); const [template,setTemplate] = useState<MemeTemplate|null>(null);
  const [topText,setTopText] = useState(id==="upload"?"YOUR TOP TEXT":"WHEN THE MEME HITS"); const [bottomText,setBottomText] = useState(id==="upload"?"YOUR BOTTOM TEXT":"JUST RIGHT");
  const [fontSize,setFontSize] = useState(38); const [font,setFont] = useState("Impact"); const [textColor,setTextColor] = useState("#ffffff");
  const [outline,setOutline] = useState(true); const [align,setAlign] = useState("center"); const [uploadedUrl,setUploadedUrl] = useState<string|null>(null);
  const [notice,setNotice] = useState(""); const [saved,setSaved] = useState(false);
  const [history,setHistory] = useState<{top:string;bottom:string}[]>([]); const [historyIndex,setHistoryIndex] = useState(-1);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(()=>{let alive=true;fetch("/api/memes?limit=100").then((res)=>res.json()).then((data)=>{if(alive&&data.success&&data.memes?.length)setCatalog(data.memes)}).catch(()=>undefined);return()=>{alive=false}},[]);
  useEffect(()=>{
    if(id==="upload"){setTemplate(null);return}
    const found=catalog.find((item)=>item.id===id)??starterMemes.find((item)=>item.id===id)??null;
    if(found){setTemplate(found);if(!draftId){setTopText(found.name.toUpperCase());setBottomText("MADE IT MINE")}}
  },[id,catalog,draftId]);
  useEffect(()=>{
    if(!draftId)return;
    try {
      const stored:Draft[]=JSON.parse(localStorage.getItem(DRAFTS_KEY)??"[]");
      const draft=stored.find((item)=>item.id===draftId);
      if(!draft)return;
      if(draft.templateId==="upload"&&draft.url.startsWith("data:"))setUploadedUrl(draft.url);
      setTopText(draft.topText);setBottomText(draft.bottomText);setFontSize(draft.fontSize??38);setOutline(draft.outline??true);setSaved(true);
    } catch { /* Ignore unavailable local drafts. */ }
  },[draftId]);
  const currentUrl=uploadedUrl??template?.url??null;
  const safeImageUrl=useMemo(()=>currentUrl&&!uploadedUrl?`/api/image?url=${encodeURIComponent(currentUrl)}`:currentUrl,[currentUrl,uploadedUrl]);

  function remember(nextTop=topText,nextBottom=bottomText){
    const next=[...history.slice(0,historyIndex+1),{top:nextTop,bottom:nextBottom}].slice(-30);
    setHistory(next);setHistoryIndex(next.length-1);
  }
  function undo(){if(historyIndex<=0)return;const previous=history[historyIndex-1];setHistoryIndex(historyIndex-1);setTopText(previous.top);setBottomText(previous.bottom)}
  function redo(){if(historyIndex>=history.length-1)return;const next=history[historyIndex+1];setHistoryIndex(historyIndex+1);setTopText(next.top);setBottomText(next.bottom)}
  function showNotice(message:string){setNotice(message);window.setTimeout(()=>setNotice(""),2600)}
  function saveDraft(){
    const draft:Draft={id:`draft-${Date.now()}`,templateId:template?.id??"upload",name:template?.name??"My uploaded meme",url:currentUrl??"",topText,bottomText,fontSize,outline,updatedAt:new Date().toISOString()};
    try{const existing:Draft[]=JSON.parse(localStorage.getItem(DRAFTS_KEY)??"[]");localStorage.setItem(DRAFTS_KEY,JSON.stringify([draft,...existing].slice(0,30)));setSaved(true);showNotice("Draft saved in this browser.")}catch{showNotice("This browser could not save the draft.")}
  }
  async function downloadMeme(){
    const canvas=document.createElement("canvas");const ctx=canvas.getContext("2d");
    if(!ctx){showNotice("Canvas export is not supported in this browser.");return}
    canvas.width=1080;canvas.height=1080;ctx.fillStyle="#e6ded1";ctx.fillRect(0,0,canvas.width,canvas.height);
    if(currentUrl){
      try{
        const image=new Image();if(!uploadedUrl)image.crossOrigin="anonymous";image.src=safeImageUrl??currentUrl;
        await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Could not load the selected image"))});
        const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);const width=image.naturalWidth*scale;const height=image.naturalHeight*scale;
        ctx.drawImage(image,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
      }catch{ctx.fillStyle="#f5f0e7";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#151515";ctx.font="700 28px Arial";ctx.textAlign="center";ctx.fillText("MEME IS MINE",canvas.width/2,canvas.height/2)}
    }
    const size=fontSize*2;ctx.textAlign=align as CanvasTextAlign;ctx.font=`900 ${size}px ${font==="Impact"?"Impact, Arial Black, sans-serif":"Arial Black, Arial, sans-serif"}`;ctx.lineJoin="round";ctx.textBaseline="middle";
    const maxWidth=canvas.width*.9;const x=align==="left"?canvas.width*.06:align==="right"?canvas.width*.94:canvas.width/2;
    const drawCaption=(value:string,y:number)=>{const lines=wrapText(ctx,value.toUpperCase(),maxWidth);const lineHeight=size*1.03;lines.forEach((line,index)=>{const lineY=y+(index-(lines.length-1)/2)*lineHeight;if(outline){ctx.lineWidth=Math.max(5,size*.09);ctx.strokeStyle="#000";ctx.strokeText(line,x,lineY,maxWidth)}ctx.fillStyle=textColor;ctx.fillText(line,x,lineY,maxWidth)})};
    if(topText.trim())drawCaption(topText,canvas.height*.105);if(bottomText.trim())drawCaption(bottomText,canvas.height*.895);
    const link=document.createElement("a");link.download=`meme-is-mine-${Date.now()}.png`;link.href=canvas.toDataURL("image/png");link.click();showNotice("Your meme is ready. Go make the group chat better.");
  }
  function wrapText(ctx:CanvasRenderingContext2D,text:string,maxWidth:number){
    const words=text.split(/\s+/).filter(Boolean);const lines:string[]=[];let line="";
    words.forEach((word)=>{const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test});
    if(line)lines.push(line);return lines.slice(0,4);
  }
  function handleImageUpload(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!file)return;
    if(!file.type.startsWith("image/")){showNotice("Please choose an image file.");return}
    if(file.size>2.5*1024*1024){showNotice("Choose an image smaller than 2.5 MB so it can be saved locally.");return}
    const reader=new FileReader();
    reader.onload=()=>{if(typeof reader.result==="string"){setUploadedUrl(reader.result);setTemplate(null);setSaved(false);showNotice("Your image is on the canvas.")}};
    reader.onerror=()=>showNotice("This image could not be read.");
    reader.readAsDataURL(file);
  }

  return <main className="paper-noise editor-page"><SiteHeader/>
    <div className="editor-topbar">
      <div className="editor-crumb"><Link href="/explore" aria-label="Back to explore"><ArrowLeft size={16}/></Link><span>/</span><Link href="/explore">Explore</Link><span>/</span><strong>{template?.name??"Your image"}</strong></div>
      <div className="saved-indicator">{saved?"Draft saved locally":"Everything stays in your browser"}</div>
      <div className="editor-top-actions"><button className="button button-paper button-small" onClick={undo} disabled={historyIndex<=0} title="Undo"><Undo2 size={14}/><span>Undo</span></button><button className="button button-paper button-small" onClick={redo} disabled={historyIndex>=history.length-1} title="Redo"><Redo2 size={14}/><span>Redo</span></button><button className="button button-dark button-small" onClick={downloadMeme}><Download size={14}/> Download PNG</button></div>
    </div>
    <div className="editor-workspace">
      <aside className="editor-sidebar">
        <div className="panel-label">Your canvas</div>
        <div className="tool-list">
          <button className="tool-button active" onClick={()=>router.push("/explore")}><Layers size={17}/>Templates</button>
          <button className="tool-button" onClick={()=>document.getElementById("top-caption")?.focus()}><Type size={17}/>Text</button>
          <button className="tool-button" onClick={()=>imageInput.current?.click()}><ImagePlus size={17}/>Image</button>
          <button className="tool-button" onClick={()=>setOutline((value)=>!value)}><Shapes size={17}/>Outline</button>
          <button className="tool-button" onClick={()=>{remember("","");setTopText("");setBottomText("")}}><RotateCcw size={17}/>Clear text</button>
        </div>
        <input ref={imageInput} type="file" accept="image/*" hidden onChange={handleImageUpload}/>
        <div className="sidebar-divider"/><div className="panel-label">Layers</div>
        <div className="layer-row"><Eye size={14}/><span>Top caption</span><Type size={14}/></div><div className="layer-row"><Eye size={14}/><span>Bottom caption</span><Type size={14}/></div><div className="layer-row"><Eye size={14}/><span>Template image</span><Layers size={14}/></div>
        <div className="sidebar-divider"/><p className="control-help">Your work is stored in this browser only. No login required.</p><button className="button button-paper button-small" style={{width:"100%",marginTop:10}} onClick={saveDraft}><Save size={14}/> Save draft</button>
      </aside>
      <section className="editor-center" aria-label="Meme preview">
        <div className="canvas-paper"><div className="canvas-preview">
          {safeImageUrl?<img src={safeImageUrl} alt={template?.name??"Your uploaded meme"} onError={(event)=>event.currentTarget.classList.add("hidden")}/>:<div className="canvas-placeholder"><ImagePlus size={38}/><strong>Start with your own image</strong><span>Upload an image to make it yours</span><button className="button button-dark button-small" onClick={()=>imageInput.current?.click()}>Choose image</button></div>}
          {topText&&<div className="meme-caption top" style={{fontSize:`clamp(15px, ${fontSize/13}vw, ${fontSize}px)`,color:textColor,textAlign:align as "left"|"center"|"right",fontFamily:font==="Impact"?"Impact, 'Arial Black', sans-serif":"'Arial Black', Arial, sans-serif",WebkitTextStroke:outline?"1px #000":"0"}}>{topText}</div>}
          {bottomText&&<div className="meme-caption bottom" style={{fontSize:`clamp(15px, ${fontSize/13}vw, ${fontSize}px)`,color:textColor,textAlign:align as "left"|"center"|"right",fontFamily:font==="Impact"?"Impact, 'Arial Black', sans-serif":"'Arial Black', Arial, sans-serif",WebkitTextStroke:outline?"1px #000":"0"}}>{bottomText}</div>}
        </div></div>
        <div className="canvas-controls"><span className="canvas-chip"><SlidersHorizontal size={13}/> Live preview</span><span className="canvas-chip">1080 × 1080 PNG</span><span className="canvas-chip"><Check size={13}/> Browser-side export</span></div><p className="editor-hint">Tip: short captions hit harder. Longer ones wrap automatically in your download.</p>
      </section>
      <aside className="editor-sidebar right">
        <div className="panel-label">Text style</div>
        <div className="control-group"><label className="control-label" htmlFor="top-caption">Top caption</label><textarea id="top-caption" className="editor-input" rows={2} maxLength={180} value={topText} onChange={(event)=>{setTopText(event.target.value);setSaved(false)}} onBlur={()=>remember(topText,bottomText)} placeholder="Write the setup…"/></div>
        <div className="control-group"><label className="control-label" htmlFor="bottom-caption">Bottom caption</label><textarea id="bottom-caption" className="editor-input" rows={2} maxLength={180} value={bottomText} onChange={(event)=>{setBottomText(event.target.value);setSaved(false)}} onBlur={()=>remember(topText,bottomText)} placeholder="Land the punchline…"/></div>
        <div className="control-group"><label className="control-label" htmlFor="font-select">Font</label><select id="font-select" className="editor-select" value={font} onChange={(event)=>setFont(event.target.value)}><option>Impact</option><option>Arial Black</option></select></div>
        <div className="control-group"><label className="control-label" htmlFor="font-size">Font size <span>{fontSize}px</span></label><input id="font-size" className="editor-range" type="range" min="20" max="54" value={fontSize} onChange={(event)=>setFontSize(Number(event.target.value))}/></div>
        <div className="control-group"><label className="control-label" htmlFor="text-color">Text colour</label><div style={{display:"flex",gap:9,alignItems:"center"}}><input id="text-color" type="color" value={textColor} onChange={(event)=>setTextColor(event.target.value)} style={{width:39,height:34,padding:2,border:"1px solid var(--line)",borderRadius:4,background:"var(--paper-light)"}}/><span className="control-help" style={{margin:0}}>{textColor.toUpperCase()}</span></div></div>
        <div className="control-group"><label className="control-label">Text alignment</label><div className="editor-field-grid">{["left","center","right"].map((value)=><button key={value} className={`filter-pill ${align===value?"active":""}`} onClick={()=>setAlign(value)}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div></div>
        <div className="control-group"><label className="control-label" htmlFor="outline-toggle">Text outline <input id="outline-toggle" type="checkbox" checked={outline} onChange={(event)=>setOutline(event.target.checked)} style={{accentColor:"var(--red)"}}/></label><p className="control-help">The classic black stroke keeps captions readable over busy images.</p></div>
        <button className="button button-red" style={{width:"100%"}} onClick={downloadMeme}><Download size={15}/> Download your meme <span aria-hidden="true">↗</span></button><button className="button button-plain button-small" style={{width:"100%",marginTop:9}} onClick={saveDraft}><Save size={14}/> Save to local studio</button>
      </aside>
    </div>
    {notice&&<div style={{position:"fixed",zIndex:100,bottom:20,right:20}}><div className="toast">{notice}</div></div>}
  </main>;
}
