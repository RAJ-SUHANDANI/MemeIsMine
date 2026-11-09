import { NextResponse } from "next/server";
import { accountSession } from "@/lib/auth";
import { imageCatalog } from "@/lib/image-catalog";
import { videoCatalog } from "@/lib/video-catalog";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET(){
 const session=await accountSession();
 if(!session)return NextResponse.json({error:"Sign in required."},{status:401,headers});
 const {data,error}=await session.client.rpc("list_my_template_likes");
 if(error)return NextResponse.json({error:"Liked formats unavailable until the database is configured."},{status:503,headers});
 const images=new Map(imageCatalog.map(template=>[template.likeId,template]));
 const videos=new Map(videoCatalog.map(template=>[template.likeId,template]));
 const items=(Array.isArray(data)?data:[]).flatMap((record:unknown)=>{
  if(!record||typeof record!=="object"||!("template_key" in record)||typeof record.template_key!=="string")return [];
  const [kind,...key]=record.template_key.split(":");
  const id=key.join(":");
  if(kind==="image"){
   const item=images.get(id);if(!item)return [];
   return [{key:record.template_key,id:item.id,kind:"image",name:item.name,image:item.url,
     editorHref:"/create/"+encodeURIComponent(item.id)+(item.source==="indian"||item.source==="indianmemetemplates"?"?source=indian":"")}];
  }
  if(kind==="video"){
   const item=videos.get(id);if(!item)return [];
   return [{key:record.template_key,id:item.id,kind:"video",name:item.name,image:item.posterUrl??"",
     editorHref:"/video-editor/"+encodeURIComponent(item.id)}];
  }
  return [];
 });
 return NextResponse.json({items},{headers});
}
