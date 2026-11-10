import { NextResponse } from "next/server";
import { accountSession } from "@/lib/auth";
import { likedKeys } from "@/lib/mim-accounts";
import { imageCatalog } from "@/lib/image-catalog";
import { videoCatalog } from "@/lib/video-catalog";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET() {
 const session=await accountSession();
 if(!session)return NextResponse.json({error:"Sign in required."},{status:401,headers});
 try{
  const images=new Map(imageCatalog.map(item=>[item.likeId,item]));
  const videos=new Map(videoCatalog.map(item=>[item.likeId,item]));
  const items=likedKeys(session.user.id).flatMap(key=>{
   const [kind,...parts]=key.split(":");const id=parts.join(":");
   if(kind==="image"){
    const image=images.get(id);
    return image?[{key,id:image.id,kind,name:image.name,image:image.url,
     editorHref:"/create/"+encodeURIComponent(image.id)+(image.source==="indian"?"?source=indian":"")}]:[];
   }
   if(kind==="video"){
    const video=videos.get(id);
    return video?[{key,id:video.id,kind,name:video.name,image:video.posterUrl??"",
     editorHref:"/video-editor/"+encodeURIComponent(video.id)}]:[];
   }
   return [];
  });
  return NextResponse.json({items},{headers});
 }catch{return NextResponse.json({error:"Liked formats are unavailable."},{status:503,headers});}
}
